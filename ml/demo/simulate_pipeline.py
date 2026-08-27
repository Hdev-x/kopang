#!/usr/bin/env python3
"""
simulate_pipeline.py — 이탈방지 파이프라인이 "매일 돌아온 것처럼" 과거 데이터를 재현한다.

배경:
  감지·대응·측정 로직은 구현돼 있지만 실제로 돈 건 2026-07-14 하루뿐이다(3,391건 일괄).
  그래서 대시보드·효과 리포트가 "하루만 솟은 봉우리 + 나머지 0"으로 보인다.
  운영 중인 서비스라면 기준일부터 매일 조금씩 쌓였어야 한다 — 그 상태를 만든다.

재현하는 것 (백엔드 규칙을 그대로 따른다):
  ① 감지  churn_score  — 그 시점 위험군을 그날 다시 감지한 것으로 기록 (source='RULE')
  ② 대응  retention_intervention — 그날 감지분 중 발송 3종 유형, 유형별 7일 중복 제외
          대조군은 InterventionServiceImpl.isControlFor 와 동일한 유형별 해시 배정 (20%)
  ③ 알림  notifications — 처치군에게만 (대조군은 기록만 남기고 발송하지 않는다)
  ④ 측정  intervention_outcome — 이 스크립트가 만들지 않는다.
          백엔드 측정 배치(POST /api/admin/churn/measure)가 실제로 판정하게 둔다.
          그래야 "측정 로직이 돈다"가 사실이 된다.

안전 규칙:
  - 생성한 모든 행에 demo_tag='SIM' 마커 → --undo 로 정확히 회수
  - 기존 행은 수정하지 않는다. INSERT 만
  - 실제 서비스 코드는 demo_tag 를 읽지도 쓰지도 않는다 (조회 결과에 영향 없음)

사용 (프로젝트 루트에서):
  ml/.venv/bin/python ml/demo/simulate_pipeline.py --dry-run
  ml/.venv/bin/python ml/demo/simulate_pipeline.py --from 2026-07-14 --to 2026-07-28
  ml/.venv/bin/python ml/demo/simulate_pipeline.py --undo

주의: 공유 Supabase 쓰기. 먼저 --dry-run.
"""
import sys
from datetime import date, timedelta

from psycopg2.extras import execute_values

from daily_activity import connect

TAG = "SIM"
DEFAULT_FROM = date(2026, 7, 14)  # 대응 발송이 처음 실제로 돈 날

# ── 백엔드와 반드시 일치해야 하는 값들 ─────────────────────────────────
# 어긋나면 시뮬레이션이 "실제 배치로는 생길 수 없는 데이터"를 만든다.
# 근거: ChurnScoreServiceImpl.toRequest / switch(riskType) / InterventionServiceImpl
SEND_TYPES = {   # riskType: (action_type, channel, notification.type, 메시지)
    "FIRST_ORDER_ONLY": ("PUSH", "IN_APP", "COMEBACK",
                         "돌아오신 것을 환영해요! 복귀 기념 특별 5,000원 할인 쿠폰이 발급되었습니다. 💖"),
    "COUPON_EXPIRING": ("PUSH", "IN_APP", "COUPON_EXPIRE",
                        "[리마인드] 보유하신 미사용 쿠폰이 곧 만료됩니다! 만료 전에 꼭 사용해 보세요. 🎟️"),
    "LOGIN_INACTIVE": ("PUSH", "IN_APP", "COMEBACK",
                       "오랜만에 뵙네요! 복귀 기념 특별 5,000원 할인 쿠폰이 발급되었습니다. 💖"),
}
CONTROL_BUCKET = 5                                        # 대조군 = 해시 % 5 == 0 (20%)
# 백엔드에서 평생 배타는 웰컴백·복귀 "쿠폰" 두 종에만 걸린다(ChurnMapper 상한②).
# 위험유형에는 평생 배타가 없고 유형별 7일 중복만 적용된다 — 여기에 유형을 넣어두면
# 과거 재현이 실제 배치보다 훨씬 적게 나가 "매일 돌아간 것처럼"이 성립하지 않는다.
EXCLUSIVE_TYPES: set[str] = set()
# ──────────────────────────────────────────────────────────────────

# 하루 대응 상한. 실제 배치엔 없는 제약이라 0(=무제한)이 실제와 일치한다.
# 70으로 묶어두면 과거는 하루 70건, 실배치는 수천 건이 되어 시계열이 어긋난다.
DAILY_SEND_CAP = 0

# ── 시연용 가정값 (실측이 아님) ────────────────────────────────────────
# 대응 이후 구매 확률. 이 8%p 차이는 **관측된 효과가 아니라 입력한 가정**이다.
# 측정 배치는 이 가정으로 만든 주문을 다시 세는 것이므로, 결과를 "효과 입증"으로
# 해석하면 순환논리가 된다. 검증되는 것은 "측정 로직이 올바로 계산하는가"까지다.
ASSUMED_TREAT_RATE = 0.31
ASSUMED_CONTROL_RATE = 0.23
# ──────────────────────────────────────────────────────────────────


def _i32(x):
    """Java int 오버플로 재현 (32bit 부호 있는 정수)"""
    x &= 0xFFFFFFFF
    return x - 0x100000000 if x >= 0x80000000 else x


def is_control(user_id, risk_type):
    """InterventionServiceImpl.isControlFor 와 **같은 결과**를 내야 한다.
    Java: Math.floorMod(Objects.hash(userId, riskType), 5) == 0
    어긋나면 같은 유저가 시뮬에선 대조군, 실제 발송에선 처치군이 되어 데이터가 모순된다."""
    h = _i32(user_id ^ (user_id >> 32))          # Long.hashCode
    s = 0
    for ch in risk_type:                          # String.hashCode
        s = _i32(31 * s + ord(ch))
    r = _i32(31 * (_i32(31 * 1 + h)) + s)         # Objects.hash = Arrays.hashCode
    return r % CONTROL_BUCKET == 0                # Python %는 항상 양수 → floorMod와 동일


def parse_args():
    args, d_from, d_to = sys.argv, DEFAULT_FROM, date.today()
    for flag in ("--from", "--to"):
        if flag in args:
            i = args.index(flag)
            if i + 1 < len(args):
                y, m, d = (int(x) for x in args[i + 1].split("-"))
                if flag == "--from":
                    d_from = date(y, m, d)
                else:
                    d_to = date(y, m, d)
    return d_from, d_to


def undo(conn):
    """demo_tag='SIM' 행만 삭제. FK 순서: outcome → notification → intervention → score"""
    cur = conn.cursor()
    counts = {}
    cur.execute("DELETE FROM intervention_outcome WHERE intervention_id IN "
                "(SELECT intervention_id FROM retention_intervention WHERE demo_tag = %s)", (TAG,))
    counts["outcome"] = cur.rowcount
    for tbl in ("notifications", "retention_intervention", "churn_score"):
        cur.execute(f"DELETE FROM {tbl} WHERE demo_tag = %s", (TAG,))
        counts[tbl] = cur.rowcount
    conn.commit()
    print("되돌리기 완료: " + " · ".join(f"{k} {v:,}" for k, v in counts.items()))


def baseline_risk(cur, day):
    """그 날짜 시점의 위험 판정(유저별 최신 1건). 이걸 '그날 다시 감지된 것'으로 기록한다.
    룰 조건이 그대로면 같은 사람이 계속 걸리는 게 정상이라, 재감지 = 판정 유지."""
    cur.execute("""
        SELECT DISTINCT ON (user_id) user_id, score, risk_level, risk_type
        FROM churn_score
        WHERE scored_at < %s::date + INTERVAL '1 day'
          AND scored_at > %s::date - INTERVAL '7 days'   -- 배치와 같은 유효기간 (7일 미재감지 = 해제)
          AND source = 'RULE' AND demo_tag IS NULL
        ORDER BY user_id, scored_at DESC, churn_score_id DESC
    """, (day, day))
    return cur.fetchall()


def simulate_day(cur, day, dry):
    """하루치 감지 → 대응 → 알림. 반환 = (감지 수, 대응 수, 알림 수)"""
    risks = baseline_risk(cur, day)
    if not risks:
        return 0, 0, 0

    # ① 감지 — 그날 룰이 돌아 위험군을 재확인한 것으로 기록.
    #    전원(약 3,900명)을 매일 다시 넣으면 15일치가 5만 행이 되는데, 지표는 "그 시점 최신 판정"으로
    #    읽으므로 그만큼이 필요하지 않다. 발송 대상 유형(대응이 나갈 사람)만 매일 기록하고
    #    나머지는 직전 판정을 그대로 유지시킨다 — 조회 결과는 같고 행 수는 1/10 이하.
    sendable = [r for r in risks if r[3] in SEND_TYPES]
    score_rows = [(u, s, lv, rt, f"{day} 03:00:00", "RULE", TAG) for u, s, lv, rt in sendable]
    score_ids = []
    if not dry:
        # churn_score_id 를 받아둔다 — 실제 대응은 이 판정을 참조하므로(FK) 연결해야
        # 위험 고객 상세의 "이 대응이 어느 감지에서 나왔나"가 성립한다.
        score_ids = [r[0] for r in execute_values(cur,
            "INSERT INTO churn_score (user_id, score, risk_level, risk_type, scored_at, source, demo_tag)"
            " VALUES %s RETURNING churn_score_id", score_rows, fetch=True)]
    score_id_of = {(sendable[i][0], sendable[i][3]): score_ids[i]
                   for i in range(len(score_ids))}

    # ② 대응 — 백엔드 상한을 그대로 적용한다
    #    상한①: 유저당 1일 1건 (처치군·대조군 모두)
    #    상한②: FIRST_ORDER_ONLY ↔ LOGIN_INACTIVE 상호 배타 (평생 1회)
    #    + 유형별 7일 중복 방지 (findInterventionTargets 의 NOT EXISTS 조건)
    cands = [(u, rt) for u, _s, _lv, rt in risks if rt in SEND_TYPES]
    cur.execute("""
        SELECT user_id, risk_type FROM retention_intervention
        WHERE created_at > %s::timestamp - INTERVAL '7 days' AND created_at <= %s::timestamp
    """, (day, day))
    recent_pairs = {(u, rt) for u, rt in cur.fetchall()}
    cur.execute("SELECT DISTINCT user_id FROM retention_intervention"
                " WHERE created_at::date = %s", (day,))
    treated_today = {r[0] for r in cur.fetchall()}
    cur.execute("SELECT DISTINCT user_id FROM retention_intervention"
                " WHERE risk_type IN ('FIRST_ORDER_ONLY','LOGIN_INACTIVE') AND created_at <= %s",
                (day,))
    exclusive_received = {r[0] for r in cur.fetchall()}

    targets = []
    for uid, rtype in cands:
        if (uid, rtype) in recent_pairs:            # 유형별 7일 중복
            continue
        if uid in treated_today:                    # 상한① (대조군 포함)
            continue
        if rtype in EXCLUSIVE_TYPES and uid in exclusive_received:   # 상한②
            continue
        targets.append((uid, rtype))
        treated_today.add(uid)
        if rtype in EXCLUSIVE_TYPES:
            exclusive_received.add(uid)
        if DAILY_SEND_CAP and len(targets) >= DAILY_SEND_CAP:
            break
    if not targets:
        return len(score_rows), 0, 0

    itv_rows, noti_rows = [], []
    for uid, rtype in targets:
        action, channel, noti_type, msg = SEND_TYPES[rtype]
        ctrl = is_control(uid, rtype)         # Java isControlFor 와 동일 결과 (검증 완료)
        itv_rows.append((uid, score_id_of.get((uid, rtype)), rtype, action, ctrl,
                         channel, "SENT", f"{day} 03:05:00", TAG))
        if not ctrl:                          # 대조군에는 발송하지 않는다 (기록만)
            noti_rows.append((uid, noti_type, msg, False, False, f"{day} 03:05:00", TAG))

    if not dry:
        execute_values(cur,
            "INSERT INTO retention_intervention (user_id, churn_score_id, risk_type, action_type,"
            " is_control, channel, status, created_at, demo_tag) VALUES %s", itv_rows)
        if noti_rows:
            execute_values(cur,
                "INSERT INTO notifications (user_id, type, message, is_read, clicked, created_at,"
                " demo_tag) VALUES %s", noti_rows)

    return len(score_rows), len(itv_rows), len(noti_rows)


def seed_conversions(conn, dry):
    """④ 대응 이후의 구매를 만든다 — 측정 배치가 판정할 '실제 주문'.

    왜 필요한가: 대응 대상은 이탈 위험군이라 daily_activity 의 주문 생성에서 제외된다.
    그래서 대응만 쌓이고 그 뒤 구매가 없어 전환율이 전부 0이 된다.

    정직하게 밝혀둘 것: 여기서 처치군 전환율을 대조군보다 높게 잡는 것은 **시연용 가정**이다.
    실제 효과를 관측한 값이 아니다. 다만 결과를 intervention_outcome 에 직접 심지 않고
    orders 에 주문을 만들어 측정 배치가 스스로 판정하게 한다 —
    "전환했다고 기록됐는데 주문 기록이 없는" 모순을 만들지 않기 위해서다.
    """
    treat_rate, control_rate = ASSUMED_TREAT_RATE, ASSUMED_CONTROL_RATE
    cur = conn.cursor()
    cur.execute("""
        SELECT r.intervention_id, r.user_id, r.is_control, r.created_at
        FROM retention_intervention r
        WHERE r.demo_tag = %s
          AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = r.user_id
                            AND o.ordered_at > r.created_at)
        ORDER BY r.intervention_id
    """, (TAG,))
    rows = cur.fetchall()
    cur.execute("""
        SELECT oi.product_id, oi.price FROM orders_item oi
        JOIN orders o ON o.order_id = oi.order_id
        WHERE o.payment_key IS DISTINCT FROM 'DEMO_SEED'
        ORDER BY random() LIMIT 500
    """)
    products = cur.fetchall()

    made = 0
    for idx, (_iid, uid, is_control, created) in enumerate(rows):
        rate = control_rate if is_control else treat_rate
        # 난수 대신 결정적 분포 — 재실행해도 같은 결과가 나오게(멱등)
        if (idx * 37 + uid) % 100 >= int(rate * 100):
            continue
        pid, price = products[(idx * 13 + uid) % len(products)]
        # 측정 창(7일) 안에 들어와야 전환으로 잡힌다. 이전엔 1~12일이라 8일 이후 주문
        # (약 5/12)이 창 밖으로 떨어져 실측 전환율이 가정(31%/23%)보다 낮게 나왔다.
        gap = 1 + (uid % 6)                        # 대응 후 1~6일 사이에 구매
        if not dry:
            cur.execute(
                "INSERT INTO orders (user_id, total_price, payment_status, order_status,"
                " payment_key, ordered_at) VALUES (%s, %s, 'PAID', 'DELIVERED', 'DEMO_SEED',"
                " %s::timestamp + (%s || ' days')::interval) RETURNING order_id",
                (uid, price, created, gap))
            oid = cur.fetchone()[0]
            cur.execute("INSERT INTO orders_item (order_id, product_id, quantity, price)"
                        " VALUES (%s, %s, 1, %s)", (oid, pid, price))
        made += 1
    if not dry:
        conn.commit()
    return made


def main():
    d_from, d_to = parse_args()
    dry = "--dry-run" in sys.argv
    conn = connect()
    try:
        if "--undo" in sys.argv:
            undo(conn)
            return
        if "--conversions-only" in sys.argv:   # 대응은 이미 있고 구매만 채울 때
            print(f"대응 이후 구매 생성: {seed_conversions(conn, dry):,}건")
            return

        print(f"{'[dry-run] ' if dry else ''}{d_from} ~ {d_to} 파이프라인 재현\n")
        print("  날짜         감지    대응   알림(처치군)")
        tot = [0, 0, 0]
        cur = conn.cursor()
        day = d_from
        while day <= d_to:
            s, i, n = simulate_day(cur, day, dry)
            print(f"  {day}  {s:6,}  {i:5,}  {n:5,}")
            tot = [a + b for a, b in zip(tot, (s, i, n))]
            day += timedelta(days=1)
        if dry:
            conn.rollback()
            print(f"\n  합계: 감지 {tot[0]:,} · 대응 {tot[1]:,} · 알림 {tot[2]:,}  (쓰기 없음)")
        else:
            conn.commit()
            print(f"\n  완료: 감지 {tot[0]:,} · 대응 {tot[1]:,} · 알림 {tot[2]:,}")
            bought = seed_conversions(conn, dry)
            print(f"  대응 이후 구매: {bought:,}건 (처치군 31% / 대조군 23% 가정)")
            print("  다음: POST /api/admin/churn/measure 로 효과 측정 실행")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
