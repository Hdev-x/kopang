#!/usr/bin/env python3
"""소량 발송 검증 — 실제로 보내보고 결과를 대조한다.

왜 필요한가:
    지금까지 발송 경로는 코드·SQL 로만 확인했다. 그런데 이 프로젝트에서 실제로
    발송을 막았던 사고(<foreach> 괄호 유실로 500)는 "호출해봐야" 드러나는 종류였다.
    전체 대상이 수천 명이라 그냥 누를 수 없어서, limit 을 걸어 소수에게만 보낸다.

무엇을 확인하는가:
    ① 발송 대상자 수가 요청한 limit 과 맞는가
    ② 알림(notifications)·대응 이력(retention_intervention)이 남는가
    ③ 쿠폰이 발급되고 재고가 차감되는가
    ④ 다시 실행했을 때 같은 사람에게 중복 발송되지 않는가 (상한)
    ⑤ 원복이 실행분만 정확히 되돌리는가 (시연·이벤트 데이터 보존)

사용:
    python3 ml/demo/verify_send.py --limit 5          # 검증 후 자동 원복
    python3 ml/demo/verify_send.py --limit 5 --keep   # 원복하지 않고 남김
"""

import argparse
import importlib.util
import json
import pathlib
import sys
import urllib.error
import urllib.request

API = "http://localhost:8080/api/admin/churn"


def load_connect():
    """DB 접속은 기존 데모 스크립트의 방식을 그대로 쓴다 (설정 중복을 만들지 않는다)."""
    here = pathlib.Path(__file__).resolve().parent
    spec = importlib.util.spec_from_file_location("daily_activity", here / "daily_activity.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.connect


def post(path, params=""):
    url = f"{API}{path}{params}"
    req = urllib.request.Request(url, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            body = r.read().decode()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        print(f"  ! {path} 실패 {e.code}: {e.read().decode()[:300]}")
        return None


def snapshot(cur):
    """검증 대상 지표를 한 번에 센다. 전후 차이가 곧 '이번 실행이 만든 것'이다."""
    def one(sql):
        cur.execute(sql)
        return cur.fetchone()[0]

    return {
        "대응 이력": one("SELECT COUNT(*) FROM retention_intervention "
                      "WHERE created_at::date = CURRENT_DATE AND demo_tag IS NULL"),
        "처치군": one("SELECT COUNT(*) FROM retention_intervention "
                    "WHERE created_at::date = CURRENT_DATE AND demo_tag IS NULL AND NOT is_control"),
        "대조군": one("SELECT COUNT(*) FROM retention_intervention "
                    "WHERE created_at::date = CURRENT_DATE AND demo_tag IS NULL AND is_control"),
        "알림": one("SELECT COUNT(*) FROM notifications "
                   "WHERE created_at::date = CURRENT_DATE AND demo_tag IS NULL"),
        "CHURN 쿠폰": one("SELECT COUNT(*) FROM user_coupons "
                        "WHERE issued_at::date = CURRENT_DATE AND issued_by = 'CHURN'"),
        "기타 쿠폰": one("SELECT COUNT(*) FROM user_coupons "
                      "WHERE issued_at::date = CURRENT_DATE AND issued_by IS NULL"),
        "쿠폰 재고합": one("SELECT COALESCE(SUM(quantity), 0) FROM coupons"),
    }


def diff(before, after):
    return {k: after[k] - before[k] for k in before}


def show(title, data, indent="    "):
    print(f"  {title}")
    for k, v in data.items():
        sign = "+" if isinstance(v, int) and v > 0 else ""
        print(f"{indent}{k:12} {sign}{v:,}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=5, help="발송 대상 수 (기본 5)")
    ap.add_argument("--keep", action="store_true", help="검증 후 원복하지 않는다")
    args = ap.parse_args()

    connect = load_connect()
    conn = connect()
    conn.autocommit = True
    cur = conn.cursor()

    print(f"\n{'=' * 58}\n소량 발송 검증 (limit={args.limit})\n{'=' * 58}")

    cur.execute("SELECT NOW()::timestamp(0), CURRENT_DATE")
    now, today = cur.fetchone()
    print(f"DB 시각 {now} · 기준일 {today}\n")

    # ── 0) 사전 상태 ─────────────────────────────
    base = snapshot(cur)
    show("① 실행 전 상태", base)
    if base["대응 이력"] > 0:
        print("\n  ⚠ 오늘 이미 실행분이 있다. 상한에 걸려 발송이 0 이 될 수 있다.")
        print("    먼저 원복(POST /batch/reset)한 뒤 다시 실행하는 것을 권한다.\n")

    # ── 1) 감지 (대상이 있어야 발송할 수 있다) ────
    print("\n② 감지 실행")
    if post("/run") is None:
        sys.exit(1)
    cur.execute("SELECT COUNT(*) FROM churn_score WHERE scored_at::date = CURRENT_DATE AND source = 'RULE'")
    print(f"    오늘 룰 판정 {cur.fetchone()[0]:,}건")

    # ── 2) 발송 대상 현황 ─────────────────────────
    with urllib.request.urlopen(f"{API}/intervene/preview", timeout=30) as r:
        preview = json.load(r)["data"]
    print(f"\n③ 발송 대상 (limit 적용 전)")
    for k, v in preview.items():
        print(f"    {k:22} {v:,}명")

    # ── 3) 소량 발송 ─────────────────────────────
    print(f"\n④ 소량 발송 (각 경로 {args.limit}명)")
    res = post("/intervene", f"?limit={args.limit}")
    if res is None:
        sys.exit(1)
    d = res.get("data", {})
    print(f"    통합 발송 → 대상 {d.get('targetCount', 0)} · 처치군 {d.get('sentCount', 0)} · 대조군 {d.get('controlCount', 0)}")
    post("/intervene/coupon-expiring", f"?limit={args.limit}")
    post("/intervene/login-inactive", f"?limit={args.limit}")

    after = snapshot(cur)
    print()
    show("⑤ 실행으로 늘어난 것", diff(base, after))

    # ── 4) 중복 발송 확인 ─────────────────────────
    print("\n⑥ 같은 조건으로 재실행 (상한이 막아야 한다)")
    res2 = post("/intervene", f"?limit={args.limit}")
    d2 = (res2 or {}).get("data", {})
    again = snapshot(cur)
    added = diff(after, again)
    print(f"    통합 발송 → 대상 {d2.get('targetCount', 0)} · 처치군 {d2.get('sentCount', 0)} · 대조군 {d2.get('controlCount', 0)}")
    print(f"    대응 이력 증가 {added['대응 이력']:+} · 알림 증가 {added['알림']:+}")
    print("    → " + ("상한이 정상 동작한다 (증가 없음)" if added["대응 이력"] == 0
                     else "⚠ 중복 발송이 발생했다. 상한 조건을 확인해야 한다"))

    # 한 사람이 두 번 받았는지 직접 확인
    cur.execute("""
        SELECT COUNT(*) FROM (
            SELECT user_id FROM retention_intervention
             WHERE created_at::date = CURRENT_DATE AND demo_tag IS NULL
             GROUP BY user_id HAVING COUNT(*) > 1) t
    """)
    dup = cur.fetchone()[0]
    print(f"    같은 날 2건 이상 받은 회원: {dup}명 " + ("(정상)" if dup == 0 else "⚠"))

    # ── 5) 원복 ──────────────────────────────────
    if args.keep:
        print("\n⑦ --keep 이라 원복하지 않는다. 확인 후 관리자 화면에서 [원상 복구]를 눌러라.")
    else:
        print("\n⑦ 원복")
        rr = post("/batch/reset")
        rd = (rr or {}).get("data", {})
        print(f"    되돌림 → 대응 {rd.get('interventions', 0)} · 측정 {rd.get('outcomes', 0)} "
              f"· 알림 {rd.get('notifications', 0)} · 쿠폰 {rd.get('coupons', 0)}")

        final = snapshot(cur)
        back = diff(base, final)
        print()
        show("⑧ 원복 후 (실행 전 대비)", back)
        ok = all(v == 0 for k, v in back.items() if k != "기타 쿠폰")
        print("\n    → " + ("실행 전 상태로 정확히 돌아왔다" if ok
                          else "⚠ 잔재가 남았다. 위 숫자가 0 이 아닌 항목을 확인하라"))
        print(f"    → 이탈방지와 무관한 쿠폰 {final['기타 쿠폰']:,}건은 그대로 보존됐다"
              if back["기타 쿠폰"] == 0 else "    ⚠ 무관한 쿠폰이 삭제됐다")

    conn.close()
    print(f"\n{'=' * 58}\n")


if __name__ == "__main__":
    main()
