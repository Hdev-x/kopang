#!/usr/bin/env python3
"""
daily_activity.py — 데모용 "쇼핑몰 일상 활동" 생성 스크립트

관리자 대시보드가 "오늘 기준"으로 살아있게, 신규 가입 + 주문 + 장바구니 + 찜을
INSERT 한다. 상시 서버가 아니라 필요할 때만 수동 실행한다.

이탈 감지와의 관계 (중요):
  - 주문 대상에서 **이탈 위험 신호 보유자를 제외**한다. cart_abandon(3일+ 방치)·
    wish_idle(7일+ 찜)은 "그 이후 주문이 없어야" 성립하는 신호라, 위험군에게 주문을
    만들면 감지 신호가 지워진다. 현실에서도 이탈 위험 고객은 주문하지 않는다.
  - 장바구니·찜을 함께 만든다. 주문만 늘리면 "담지도 않고 바로 사는 쇼핑몰"이 되고,
    새 CART_ABANDON·WISHLIST_IDLE 대상이 생기지 않아 룰이 말라버린다.

원칙 (팀 DB 상의 반영):
  - 기존 users / products 는 절대 수정(UPDATE) 안 함 — 참조(조회)만
  - 신규 INSERT 만: users(가입) / orders + orders_item / cart + cart_item / wishlist
  - 장바구니·찜은 **데모 유저에게만** 만든다 — 이 테이블엔 마커 컬럼이 없어서
    기존 유저에게 만들면 되돌릴 수 없다. 유저 삭제로 함께 정리되는 범위만 건드린다
  - 되돌리기: 유저는 '@kopang.demo' 도메인, 주문은 payment_key='DEMO_SEED' 마커 (--undo)

사용 (프로젝트 루트에서):
  python3 ml/demo/daily_activity.py --dry-run        # 무엇이 얼마나 들어갈지만 확인 (쓰기 없음)
  python3 ml/demo/daily_activity.py                  # 오늘자 활동 생성
  python3 ml/demo/daily_activity.py --backfill 25    # 오늘 포함 최근 26일치 주문까지 생성
  python3 ml/demo/daily_activity.py --undo           # 데모 계정(@kopang.demo)과 그 주문 삭제

주의: 공유 Supabase 에 쓰므로 팀 DB 상의 후 실행. 실행 전 --dry-run 으로 규모를 먼저 본다.
"""
import re
import sys
import random
import psycopg2

# ── 하루 생성량 (여기만 조정하면 됨) ─────────────────────────────
N_NEW_USERS = 10      # 오늘 신규 가입 수
N_ORDERS = 271        # 하루 주문 수 — 기존 6월 실적(8,137건/30일)에 맞춤
N_CARTS = 25          # 하루 장바구니 담기 (결제까지 안 간 것 = 방치 후보)
N_WISHES = 18         # 하루 찜
N_EXPIRING_COUPONS = 25   # 하루 "곧 만료되는 미사용 쿠폰" 보유자 (COUPON_EXPIRING 룰 대상)
EXPIRING_COUPON_ID = 2    # 웰컴백 3000원 — 발급 경로가 살아있는 쿠폰으로
DEMO_DOMAIN = "kopang.demo"   # 되돌리기 식별용 마커 도메인
# ────────────────────────────────────────────────────────────────

SURNAMES = list("김이박최정강조윤장임한오서신권황안송류전홍")
GIVEN = ["민준", "서연", "도윤", "지우", "예준", "하은", "주원", "지민",
         "지호", "수아", "은우", "다은", "시우", "예은", "유준", "채원"]


def connect():
    props = {}
    with open("backend/src/main/resources/application-dev.properties", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("spring.datasource."):
                k, _, v = line.partition("=")
                props[k.strip()] = v.strip()
    m = re.match(r"jdbc:postgresql://([^:/]+):(\d+)/(\w+)", props["spring.datasource.url"])
    return psycopg2.connect(
        host=m.group(1), port=m.group(2), dbname=m.group(3),
        user=props["spring.datasource.username"],
        password=props["spring.datasource.password"], connect_timeout=10,
    )


def undo(conn):
    """데모 생성분 삭제 (되돌리기). 주문은 마커 payment_key='DEMO_SEED' 기준
    → 기존 유저가 주문한 것도 정확히 삭제. 유저는 @kopang.demo 도메인 기준."""
    cur = conn.cursor()
    # 1) 데모 주문(마커) → 아이템 먼저, 그 다음 헤더 (FK 순서)
    cur.execute("DELETE FROM orders_item WHERE order_id IN "
                "(SELECT order_id FROM orders WHERE payment_key = 'DEMO_SEED')")
    oi = cur.rowcount
    cur.execute("DELETE FROM orders WHERE payment_key = 'DEMO_SEED'"); od = cur.rowcount
    # 2) 데모 유저 참조 정리 (ml-run이 남긴 churn_score 등) 후 유저 삭제 (FK 순서)
    cur.execute("SELECT user_id FROM users WHERE email LIKE %s", (f"%@{DEMO_DOMAIN}",))
    demo_ids = [r[0] for r in cur.fetchall()]
    us = ci = wl = 0
    if demo_ids:
        # 장바구니·찜은 데모 유저에게만 만들므로 유저 기준으로 정확히 정리된다 (FK 순서: item → cart)
        cur.execute("DELETE FROM cart_item WHERE cart_id IN "
                    "(SELECT cart_id FROM cart WHERE user_id = ANY(%s))", (demo_ids,)); ci = cur.rowcount
        cur.execute("DELETE FROM cart WHERE user_id = ANY(%s)", (demo_ids,))
        cur.execute("DELETE FROM wishlist WHERE user_id = ANY(%s)", (demo_ids,)); wl = cur.rowcount
        cur.execute("DELETE FROM user_coupons WHERE user_id = ANY(%s)", (demo_ids,))
        cur.execute("DELETE FROM churn_score WHERE user_id = ANY(%s)", (demo_ids,))
        cur.execute("DELETE FROM users WHERE user_id = ANY(%s)", (demo_ids,)); us = cur.rowcount
    conn.commit()
    print(f"되돌리기 완료: users {us} · orders {od} · orders_item {oi} · "
          f"cart_item {ci} · wishlist {wl} 삭제")


def preview(conn, backfill_days=0):
    """--dry-run: 쓰기 없이 "지금 상태 → 실행하면 얼마가 되는지"만 계산해 보여준다.
    공유 DB에 쓰는 스크립트라 실행 전 규모 확인을 강제하기 위한 안전장치."""
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM users WHERE email LIKE %s", (f"%@{DEMO_DOMAIN}",))
    demo_users = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM orders WHERE payment_key = 'DEMO_SEED'")
    demo_orders = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM orders WHERE ordered_at >= date_trunc('day', NOW())")
    today_orders = cur.fetchone()[0]

    days = backfill_days + 1
    print("[dry-run] 쓰기 없음 — 예상 변경만 계산했다\n")
    print(f"  현재 데모 마커 유저(@{DEMO_DOMAIN}) : {demo_users:,}명")
    print(f"  현재 데모 마커 주문(DEMO_SEED)      : {demo_orders:,}건")
    print(f"  오늘자 주문(전체, 마커 무관)        : {today_orders:,}건")
    print()
    print(f"  실행하면 INSERT ({days}일치)")
    print(f"    유저     {N_NEW_USERS * days:>7,}명  ({N_NEW_USERS}명/일)")
    print(f"    주문     {N_ORDERS * days:>7,}건  ({N_ORDERS}건/일)")
    print(f"    장바구니 {N_CARTS * days:>7,}건  ({N_CARTS}건/일 — 데모 유저에게만)")
    print(f"    찜       {N_WISHES * days:>7,}건  ({N_WISHES}건/일 — 데모 유저에게만)")
    print()
    print("  주문 대상에서 이탈 위험 신호(장바구니 3일+ 방치·찜 7일+) 보유자는 제외한다")
    print("  되돌리기: --undo (마커·데모 유저 기준으로 정확히 이 분량만 삭제)")


def generate(conn, backfill_days=0, future_days=0):
    cur = conn.cursor()

    # 1) 참조만 — 상품 풀은 "실제로 팔린 이력"에서 뽑는다.
    #    products 전체를 균등 추출하면 고가 상품이 과대 표집돼 주문 평균가가 기존의 20배로 튄다.
    #    orders_item 을 그대로 쓰면 판매 빈도가 곧 가중치가 되어 기존 금액 분포를 따라간다.
    #    가격도 orders_item.price(주문 당시 가격)를 그대로 쓴다 — 현재 상품가를 쓰면 단가가 2.6배로 뜬다.
    cur.execute("""
        SELECT oi.product_id, oi.price
        FROM orders_item oi
        JOIN orders o ON o.order_id = oi.order_id
        WHERE o.payment_key IS DISTINCT FROM 'DEMO_SEED'
        ORDER BY random() LIMIT 3000
    """)
    products = cur.fetchall()
    if not products:  # 주문 이력이 없는 새 환경 — 상품 마스터로 대체
        cur.execute("SELECT product_id, COALESCE(discount_price, price) FROM products WHERE status = 'ACTIVE'")
        products = cur.fetchall()
    #    주문 대상에서 "이탈 위험 신호 보유자"를 제외한다.
    #    cart_abandon(3일+ 방치)·wish_idle(7일+ 찜)은 "그 이후 주문이 없어야" 성립하는 신호라,
    #    위험군에게 주문을 만들면 감지 신호가 지워진다(실측: 40명 소실).
    #    현실에서도 이탈 위험 고객은 주문을 하지 않는다 — 그 구조를 그대로 반영한다.
    #    보호 대상은 두 신호에 그치지 않는다. 주문을 만들면 FIRST_ORDER_ONLY(주문 1건 조건)가
    #    깨지고 SPENDING_DROP(최근 지출)도 흔들리며, 무엇보다 **대응을 받은 위험군**에게
    #    무작위 주문이 생기면 측정 창에 들어가 전환으로 오판된다.
    #    → 최근 위험 판정을 받았거나 대응을 받은 유저는 전부 주문 대상에서 뺀다.
    cur.execute("""
        SELECT u.user_id FROM users u
        WHERE u.role = 'ROLE_USER'
          AND NOT EXISTS (
              SELECT 1 FROM cart c JOIN cart_item ci ON ci.cart_id = c.cart_id
              WHERE c.user_id = u.user_id AND ci.added_at < NOW() - INTERVAL '3 days')
          AND NOT EXISTS (
              SELECT 1 FROM wishlist w
              WHERE w.user_id = u.user_id AND w.created_at < NOW() - INTERVAL '7 days')
          AND NOT EXISTS (
              SELECT 1 FROM churn_score cs
              WHERE cs.user_id = u.user_id AND cs.source = 'RULE'
                AND cs.scored_at > NOW() - INTERVAL '14 days')
          AND NOT EXISTS (
              SELECT 1 FROM retention_intervention r
              WHERE r.user_id = u.user_id AND r.created_at > NOW() - INTERVAL '14 days')
        ORDER BY random() LIMIT 2000
    """)
    existing_users = [r[0] for r in cur.fetchall()]

    # 2) 신규 유저 INSERT — 날짜별로 나눠 가입시킨다(매일 유입이 있는 쇼핑몰).
    #    장바구니·찜은 이 데모 유저에게만 만든다: cart/wishlist 에는 마커 컬럼이 없어
    #    기존 유저에게 만들면 되돌릴 수 없다. 유저 삭제로 함께 정리되는 범위만 건드린다.
    new_user_ids = []
    for d in range(backfill_days + 1):
        off = d - future_days   # future_days 만큼 미래로 민다 (부재일 대비 선생성)
        joined_expr = (f"date_trunc('day', NOW() - INTERVAL '{off} days') + random() * INTERVAL '24 hours'"
                       if off else "NOW()")
        for _ in range(N_NEW_USERS):
            name = random.choice(SURNAMES) + random.choice(GIVEN)
            email = f"demo_{random.randint(10**7, 10**8-1)}@{DEMO_DOMAIN}"
            cur.execute(
                "INSERT INTO users (email, password, name, role, status, created_at, last_login_at) "
                f"VALUES (%s, %s, %s, 'ROLE_USER', 'ACTIVE', {joined_expr}, {joined_expr}) RETURNING user_id",
                (email, "{demo}", name),
            )
            new_user_ids.append(cur.fetchone()[0])

    # 3) 주문 INSERT — backfill_days 일 전까지 각 날짜에 N_ORDERS건씩 (주간 추이 채움)
    #    데모 유저를 구매/방치 두 그룹으로 나눈다. 한 유저가 담고(4단계) 사기도 하면(여기)
    #    자기 방치 신호를 자기가 지운다 — 실측으로 201명이 사라졌다.
    split = len(new_user_ids) // 2
    buyer_demo, idle_demo = new_user_ids[:split], new_user_ids[split:]
    order_pool = existing_users + buyer_demo * 2  # 신규 유저 가중(방금 가입해 첫 주문)
    made = 0
    for d in range(backfill_days + 1):
        # 오늘은 0시~지금, 그 외(과거·미래)는 그 날 종일에 걸쳐 분포
        off = d - future_days
        if off == 0:
            ts_expr = "date_trunc('day', NOW()) + random() * (NOW() - date_trunc('day', NOW()))"
        else:
            ts_expr = f"date_trunc('day', NOW() - INTERVAL '{off} days') + random() * INTERVAL '24 hours'"
        for _ in range(N_ORDERS):
            uid = random.choice(order_pool)
            # 기존 주문은 전부 "1주문 = 1상품 × 1개" 구조다(평균 54,664원).
            # 여러 상품·수량을 섞으면 주문 평균액이 기존의 10배로 벌어져 매출 추이가 어긋난다.
            picks = [random.choice(products)]
            total = 0
            cur.execute(
                "INSERT INTO orders (user_id, total_price, payment_status, order_status, payment_key, ordered_at) "
                f"VALUES (%s, %s, 'PAID', 'DELIVERED', 'DEMO_SEED', {ts_expr}) "
                "RETURNING order_id",
                (uid, 0),
            )
            oid = cur.fetchone()[0]
            for pid, price in picks:
                qty = 1
                total += price * qty
                cur.execute(
                    "INSERT INTO orders_item (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                    (oid, pid, qty, price),
                )
            # 합계 확정 (방금 만든 내 주문만)
            cur.execute("UPDATE orders SET total_price = %s WHERE order_id = %s", (total, oid))
            made += 1

    # 4) 장바구니·찜 INSERT — 결제까지 가지 않은 행동.
    #    이게 없으면 "담지도 않고 바로 사는 쇼핑몰"이 되고, 시간이 지나면
    #    CART_ABANDON(3일+)·WISHLIST_IDLE(7일+) 대상이 새로 생기지 않아 룰이 말라버린다.
    #    대상은 주문 풀과 겹치지 않게 뽑는다 — 주문한 유저는 방치 신호가 성립하지 않는다.
    idle_pool = idle_demo
    carts, wishes = 0, 0
    for d in range(backfill_days + 1):
        day_expr = (f"date_trunc('day', NOW() - INTERVAL '{d - future_days} days')"
                    f" + random() * INTERVAL '24 hours'") if (d - future_days) else \
                   "date_trunc('day', NOW()) + random() * (NOW() - date_trunc('day', NOW()))"
        for _ in range(N_CARTS):
            uid = random.choice(idle_pool)
            pid, _price = random.choice(products)
            # 유저당 장바구니는 1개 재사용 (스키마상 cart 1 : cart_item N)
            cur.execute("SELECT cart_id FROM cart WHERE user_id = %s LIMIT 1", (uid,))
            row = cur.fetchone()
            if row:
                cid = row[0]
            else:
                cur.execute(f"INSERT INTO cart (user_id, created_at) VALUES (%s, {day_expr}) RETURNING cart_id", (uid,))
                cid = cur.fetchone()[0]
            cur.execute(
                "INSERT INTO cart_item (cart_id, product_id, quantity, added_at) "
                f"VALUES (%s, %s, 1, {day_expr})", (cid, pid))
            carts += 1
        for _ in range(N_WISHES):
            uid = random.choice(idle_pool)
            pid, _price = random.choice(products)
            cur.execute(
                "INSERT INTO wishlist (user_id, product_id, created_at) "
                f"SELECT %s, %s, {day_expr} "
                "WHERE NOT EXISTS (SELECT 1 FROM wishlist WHERE user_id = %s AND product_id = %s)",
                (uid, pid, uid, pid))
            wishes += cur.rowcount

    # 5) 만료 임박 쿠폰 — COUPON_EXPIRING 룰(미사용 + 만료 3일 이내)의 대상을 유지한다.
    #    이게 없으면 시드가 뿌린 만료일이 지나간 뒤로 대상이 영구히 0이 되어
    #    "쿠폰 만료 임박" 발송 경로가 죽는다(발표 시연에서 버튼 하나가 빈다).
    #    쿠폰은 소비되는 자원이라 활동처럼 매일 새로 만들어져야 수명주기가 이어진다.
    #    대상은 누적된 데모 유저 전체에서 뽑는다. 그날 만든 유저(idle_pool)만 쓰면
    #    하루 5명뿐이라 발송 대상이 너무 적다.
    cur.execute("SELECT user_id FROM users WHERE email LIKE %s ORDER BY random() LIMIT %s",
                (f"%@{DEMO_DOMAIN}", N_EXPIRING_COUPONS))
    coupon_pool = [r[0] for r in cur.fetchall()] or idle_pool

    coupons_made = 0
    for i, uid in enumerate(coupon_pool[:N_EXPIRING_COUPONS]):
        days_left = 1 + (i % 3)   # 1~3일 뒤 만료
        cur.execute(
            "INSERT INTO user_coupons (user_id, coupon_id, used, issued_at, expires_at) "
            "SELECT %s, %s, FALSE, NOW() - INTERVAL '20 days',"
            "       CURRENT_DATE + (%s * INTERVAL '1 day') "
            "WHERE NOT EXISTS (SELECT 1 FROM user_coupons uc "
            "                   WHERE uc.user_id = %s AND uc.coupon_id = %s)",
            (uid, EXPIRING_COUPON_ID, days_left, uid, EXPIRING_COUPON_ID))
        coupons_made += cur.rowcount

    conn.commit()
    span = "오늘자" if backfill_days == 0 else f"최근 {backfill_days + 1}일"
    print(f"생성 완료: 신규 유저 {len(new_user_ids)}명 · 주문 {made:,}건 · "
          f"장바구니 {carts:,}건 · 찜 {wishes:,}건 · 만료임박 쿠폰 {coupons_made}건 ({span})")


def main():
    conn = connect()
    try:
        # --backfill N : 오늘 포함 최근 N일치 주문도 생성 (주간 추이 채움용). 기본 0=오늘만
        backfill = 0
        if "--backfill" in sys.argv:
            idx = sys.argv.index("--backfill")
            if idx + 1 < len(sys.argv):
                backfill = int(sys.argv[idx + 1])

        # --future N : 오늘이 아니라 N일 뒤 날짜로 생성 (부재일 대비 선생성)
        future = 0
        if "--future" in sys.argv:
            i = sys.argv.index("--future")
            if i + 1 < len(sys.argv):
                future = int(sys.argv[i + 1])

        if "--undo" in sys.argv:
            undo(conn)
        elif "--dry-run" in sys.argv:
            preview(conn, backfill)
        else:
            generate(conn, backfill, future)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
