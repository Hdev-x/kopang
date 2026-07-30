#!/usr/bin/env python3
"""
seed_point_rewards.py — 구매확정 포인트 적립 이력을 소급 생성한다.

배경:
  포인트는 구매확정 시점에만 적립된다(OrderService.confirmPurchase).
  그런데 시드 주문 7만여 건이 DELIVERED 에서 멈춰 있어 구매확정이 8건뿐이고,
  관리자 포인트 관리 화면의 "멤버십 · 일반 적립 비교"가 사실상 빈 표가 된다.
  실제 커머스의 자동 구매확정(배송 후 N일)을 재현해 그 구간을 만든다.

재현하는 것 (백엔드 규칙을 그대로 따른다):
  ① 주문   order_status: DELIVERED → CONFIRMED
  ② 적립   point_history INSERT — 일반 1% · 멤버십 5%, floor 처리
           등급 판정은 user_membership.status='ACTIVE' (OrderService 와 동일 기준)
           description 형식도 OrderService 와 동일하게 맞춰 관리자 화면 집계에 잡히게 한다

안전 규칙 (daily_activity.py / simulate_pipeline.py 와 동일 철학):
  - 대상은 payment_key='DEMO_SEED' 인 시드 주문만. 실제 주문은 건드리지 않는다
  - 되돌리기 기준선: 실행 전 CONFIRMED 인 DEMO_SEED 주문은 0건이어야 한다
    (--undo 는 CONFIRMED 인 DEMO_SEED 주문만 DELIVERED 로 되돌리고 그 적립 이력을 지운다)
  - 주문 선택은 order_id 순으로 결정적이다 — 같은 인자로 다시 돌려도 같은 대상

사용 (프로젝트 루트에서):
  ml/.venv/bin/python ml/demo/seed_point_rewards.py --dry-run
  ml/.venv/bin/python ml/demo/seed_point_rewards.py
  ml/.venv/bin/python ml/demo/seed_point_rewards.py --undo
  ... --general 80 --membership 70 --days 14

주의: 공유 Supabase 쓰기. 백엔드를 내리고 실행한다(세션 풀러 15 커넥션 제한).
      orders 는 커머스(세민) 영역이므로 실행 후 팀 공유가 필요하다.
"""
import sys

from psycopg2.extras import execute_values

from daily_activity import connect

# OrderService.confirmPurchase 와 반드시 일치해야 하는 값
RATE = {"MEMBERSHIP": (0.05, 5), "GENERAL": (0.01, 1)}

TIER_SQL = """CASE WHEN EXISTS (
    SELECT 1 FROM user_membership um
    WHERE um.user_id = o.user_id AND um.status = 'ACTIVE'
) THEN 'MEMBERSHIP' ELSE 'GENERAL' END"""


def pick(cur, tier, limit, days):
    """되돌리기 가능한 시드 주문 중 해당 등급 상위 N건. order_id 순이라 결정적이다."""
    cur.execute(
        f"""SELECT o.order_id, o.user_id, o.total_price, o.ordered_at
            FROM orders o
            WHERE o.payment_key = 'DEMO_SEED'
              AND o.order_status = 'DELIVERED'
              AND o.payment_status = 'PAID'
              AND o.ordered_at >= CURRENT_DATE - %s
              AND {TIER_SQL} = %s
            ORDER BY o.order_id
            LIMIT %s""",
        (days, tier, limit),
    )
    return cur.fetchall()


def summarize(rows, tier):
    rate, pct = RATE[tier]
    points = [int(r[2] * rate) for r in rows]
    total = sum(points)
    avg = total // len(points) if points else 0
    return pct, len(rows), total, avg


def preview(conn, counts, days):
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM orders WHERE payment_key='DEMO_SEED' AND order_status='CONFIRMED'")
    baseline = cur.fetchone()[0]

    print(f"[dry-run] 쓰기 없음 — 최근 {days}일 DEMO_SEED 배송완료 주문 대상\n")
    print(f"  {'등급':<12}{'적립률':>7}{'주문':>8}{'적립 합계':>14}{'건당 평균':>12}")
    grand = 0
    for tier, limit in counts.items():
        rows = pick(cur, tier, limit, days)
        pct, n, total, avg = summarize(rows, tier)
        grand += total
        print(f"  {tier:<12}{pct:>6}%{n:>8,}{total:>13,}P{avg:>11,}P")
    print(f"\n  주문 상태 변경: DELIVERED → CONFIRMED {sum(counts.values()):,}건")
    print(f"  point_history INSERT: {sum(counts.values()):,}행 · 총 {grand:,}P")
    print(f"  현재 CONFIRMED 인 DEMO_SEED 주문: {baseline}건 (0이어야 --undo 가 정확하다)")
    cur.close()


def generate(conn, counts, days):
    cur = conn.cursor()
    made = {}
    for tier, limit in counts.items():
        rows = pick(cur, tier, limit, days)
        if not rows:
            made[tier] = (0, 0)
            continue
        rate, pct = RATE[tier]
        order_ids = [r[0] for r in rows]

        values = [
            (
                r[1],
                int(r[2] * rate),
                "SAVED",
                f"구매확정 포인트 적립 ({pct}% 적립, 주문 ID: {r[0]})",
                r[3],
            )
            for r in rows
        ]
        # 적립 시각은 주문 3일 뒤(자동 구매확정 시점). 미래로 넘어가지 않게 자른다.
        execute_values(
            cur,
            """INSERT INTO point_history (user_id, amount, type, description, created_at)
               VALUES %s""",
            values,
            template="(%s, %s, %s, %s, LEAST(%s::timestamp + INTERVAL '3 days', NOW() - INTERVAL '1 hour'))",
        )
        cur.execute(
            "UPDATE orders SET order_status='CONFIRMED' WHERE order_id = ANY(%s)",
            (order_ids,),
        )
        made[tier] = (len(rows), sum(v[1] for v in values))

    conn.commit()
    cur.close()
    parts = " · ".join(f"{t} {n:,}건 {p:,}P" for t, (n, p) in made.items())
    print(f"생성 완료: {parts}")
    print("되돌리기: --undo (CONFIRMED 인 DEMO_SEED 주문과 그 적립 이력만 삭제)")


def undo(conn):
    cur = conn.cursor()
    cur.execute("""SELECT order_id FROM orders
                   WHERE payment_key='DEMO_SEED' AND order_status='CONFIRMED'""")
    order_ids = [r[0] for r in cur.fetchall()]
    if not order_ids:
        print("되돌릴 대상 없음")
        cur.close()
        return

    cur.execute(
        """DELETE FROM point_history
           WHERE type='SAVED'
             AND description LIKE '구매확정 포인트 적립%%'
             AND split_part(description, '주문 ID: ', 2) = ANY(%s)""",
        ([str(i) for i in order_ids],),
    )
    deleted = cur.rowcount
    cur.execute("UPDATE orders SET order_status='DELIVERED' WHERE order_id = ANY(%s)", (order_ids,))
    conn.commit()
    cur.close()
    print(f"되돌리기 완료: 주문 {len(order_ids):,}건 DELIVERED 복귀 · 적립 이력 {deleted:,}행 삭제")


def main():
    def arg(name, default):
        if name in sys.argv:
            i = sys.argv.index(name)
            if i + 1 < len(sys.argv):
                return int(sys.argv[i + 1])
        return default

    counts = {"MEMBERSHIP": arg("--membership", 70), "GENERAL": arg("--general", 80)}
    days = arg("--days", 14)

    conn = connect()
    try:
        if "--undo" in sys.argv:
            undo(conn)
        elif "--dry-run" in sys.argv:
            preview(conn, counts, days)
        else:
            generate(conn, counts, days)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
