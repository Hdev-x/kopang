#!/usr/bin/env python3
"""
daily_activity.py — 데모용 "오늘자 신규 활동" 생성 스크립트

관리자 대시보드가 "오늘 기준"으로 살아있게, 하루에 한 번 수동 실행해 오늘자
신규 가입 + 주문을 소량 INSERT 한다. 상시 서버가 아니라 필요할 때만 돌린다.

원칙 (팀 DB 상의 반영):
  - 기존 users / products 는 절대 수정(UPDATE) 안 함 — 참조(조회)만
  - 신규 INSERT 만: users(가입) / orders + orders_item(주문)
  - 되돌리기: 신규 유저 email 이 '@kopang.demo' → 오늘 생성분만 골라 삭제 (아래 --undo)

사용:
  python3 ml/daily_activity.py          # 오늘자 활동 생성
  python3 ml/daily_activity.py --undo   # 데모 계정(@kopang.demo)과 그 주문 삭제

주의: 공유 Supabase 에 쓰므로 팀 DB 상의 후 실행.
"""
import re
import sys
import random
import psycopg2

# ── 하루 생성량 (여기만 조정하면 됨) ─────────────────────────────
N_NEW_USERS = 10      # 오늘 신규 가입 수
N_ORDERS = 40         # 오늘 주문 수 (기존 유저 + 오늘 신규 유저 섞어서)
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
    # 2) 데모 유저 (주문이 위에서 지워졌으니 FK 안전)
    cur.execute("DELETE FROM users WHERE email LIKE %s", (f"%@{DEMO_DOMAIN}",)); us = cur.rowcount
    conn.commit()
    print(f"되돌리기 완료: users {us} · orders {od} · orders_item {oi} 삭제")


def generate(conn):
    cur = conn.cursor()

    # 1) 참조만 — 기존 상품(가격 포함) / 기존 유저 id
    cur.execute("SELECT product_id, COALESCE(discount_price, price) FROM products WHERE status = 'ACTIVE'")
    products = cur.fetchall()
    if not products:
        cur.execute("SELECT product_id, COALESCE(discount_price, price) FROM products")
        products = cur.fetchall()
    cur.execute("SELECT user_id FROM users WHERE role = 'ROLE_USER' ORDER BY random() LIMIT 200")
    existing_users = [r[0] for r in cur.fetchall()]

    # 2) 신규 유저 INSERT (오늘 가입) — id 는 시퀀스가 자동 부여
    new_user_ids = []
    for _ in range(N_NEW_USERS):
        name = random.choice(SURNAMES) + random.choice(GIVEN)
        email = f"demo_{random.randint(10**7, 10**8-1)}@{DEMO_DOMAIN}"
        cur.execute(
            "INSERT INTO users (email, password, name, role, status, created_at, last_login_at) "
            "VALUES (%s, %s, %s, 'ROLE_USER', 'ACTIVE', NOW(), NOW()) RETURNING user_id",
            (email, "{demo}", name),
        )
        new_user_ids.append(cur.fetchone()[0])

    # 3) 주문 INSERT — 오늘 시각 안에서 분산, 기존+신규 유저 섞어서
    order_pool = existing_users + new_user_ids * 2  # 신규 유저 가중(방금 가입해 첫 주문)
    made = 0
    for _ in range(N_ORDERS):
        uid = random.choice(order_pool)
        n_items = random.randint(1, 3)
        picks = random.sample(products, min(n_items, len(products)))
        total = 0
        # 주문 헤더 (오늘 안에서 랜덤 시각, 결제·배송 완료)
        cur.execute(
            "INSERT INTO orders (user_id, total_price, payment_status, order_status, payment_key, ordered_at) "
            "VALUES (%s, %s, 'PAID', 'DELIVERED', 'DEMO_SEED', "
            "  date_trunc('day', NOW()) + random() * (NOW() - date_trunc('day', NOW()))) "  # 오늘 0시~지금 랜덤
            "RETURNING order_id",
            (uid, 0),
        )
        oid = cur.fetchone()[0]
        for pid, price in picks:
            qty = random.randint(1, 3)
            total += price * qty
            cur.execute(
                "INSERT INTO orders_item (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                (oid, pid, qty, price),
            )
        # 합계 확정 (헤더 total_price 갱신 — 방금 만든 내 주문만)
        cur.execute("UPDATE orders SET total_price = %s WHERE order_id = %s", (total, oid))
        made += 1

    conn.commit()
    print(f"생성 완료: 신규 유저 {len(new_user_ids)}명 · 주문 {made}건 (오늘자)")


def main():
    conn = connect()
    try:
        if "--undo" in sys.argv:
            undo(conn)
        else:
            generate(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
