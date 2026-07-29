-- Kopang 유저 피처 집계 SQL (경로③ 정합성의 핵심)
-- 이 쿼리 하나를 두 곳에서 사용한다:
--   1) ML 학습 CSV 추출:  \copy (아래 SELECT) TO 'user_profiles_v3.csv' CSV HEADER
--   2) 앱 배치 스코어링:  Spring/FastAPI가 같은 쿼리로 실전 피처 계산 → "학습 계산 = 실전 계산"
-- 컬럼 = user_profiles_v2.csv 와 동일 (seed_group/seed_type/churned 제외 — 라벨은 user_id로 조인)

WITH ok_orders AS (                       -- 유효 주문 (취소·반품 제외)
    SELECT * FROM orders
    WHERE order_status NOT IN ('CANCELLED', 'RETURNED')
),
last_ok AS (
    SELECT user_id, MAX(ordered_at) AS last_at, SUM(total_price) AS spend
    FROM ok_orders GROUP BY user_id
),
all_orders AS (                           -- 주문 수는 취소 포함 전체 (CSV 피처와 동일 정의)
    SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id
),
spend_windows AS (                        -- ⑧ 최근 30일 vs 직전 30일
    SELECT user_id,
           SUM(total_price) FILTER (WHERE ordered_at >= NOW() - INTERVAL '30 days') AS recent30,
           SUM(total_price) FILTER (WHERE ordered_at >= NOW() - INTERVAL '60 days'
                                      AND ordered_at <  NOW() - INTERVAL '30 days') AS prev30
    FROM ok_orders GROUP BY user_id
),
cart_abandon AS (                         -- ① 3일+ 방치 & 이후 유효 주문 없음
    SELECT c.user_id, COUNT(*) AS cnt
    FROM cart_item ci
    JOIN cart c ON c.cart_id = ci.cart_id
    WHERE ci.added_at < NOW() - INTERVAL '3 days'
      AND NOT EXISTS (SELECT 1 FROM ok_orders o
                      WHERE o.user_id = c.user_id AND o.ordered_at > ci.added_at)
    GROUP BY c.user_id
),
wish_idle AS (                            -- ④ 7일+ 찜 & 해당 상품 미주문
    SELECT w.user_id, COUNT(*) AS cnt
    FROM wishlist w
    WHERE w.created_at < NOW() - INTERVAL '7 days'
      AND NOT EXISTS (SELECT 1 FROM ok_orders o
                      JOIN orders_item oi ON oi.order_id = o.order_id
                      WHERE o.user_id = w.user_id AND oi.product_id = w.product_id)
    GROUP BY w.user_id
),
coupon_exp AS (                           -- ⑤ 미사용 & 만료 3일 이내
    SELECT user_id, COUNT(*) AS cnt
    FROM user_coupons
    WHERE used = FALSE
      AND expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + 3
    GROUP BY user_id
),
bad_reviews AS (                          -- ⑥-a 최근 30일 평점≤2
    SELECT user_id, COUNT(*) AS cnt FROM reviews
    WHERE rating <= 2 AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY user_id
),
cancels AS (                              -- ⑥-b 최근 30일 취소·반품
    SELECT user_id, COUNT(*) AS cnt FROM orders
    WHERE order_status IN ('CANCELLED', 'RETURNED')
      AND ordered_at >= NOW() - INTERVAL '30 days'
    GROUP BY user_id
),
sat AS (                                  -- 만족도 (최신 응답)
    SELECT DISTINCT ON (user_id) user_id, score
    FROM satisfaction_survey ORDER BY user_id, created_at DESC
)
SELECT
    u.user_id,
    CASE WHEN EXISTS (SELECT 1 FROM user_membership m
                      WHERE m.user_id = u.user_id AND m.status = 'ACTIVE')
         THEN 1 ELSE 0 END                                          AS is_member,
    CASE WHEN EXISTS (SELECT 1 FROM user_membership m
                      WHERE m.user_id = u.user_id AND m.status = 'CANCELLED')
         THEN 1 ELSE 0 END                                          AS membership_cancelled,
    EXTRACT(DAY FROM NOW() - u.created_at)::int                     AS tenure_days,
    EXTRACT(DAY FROM NOW() - u.last_login_at)::int                  AS recency_days,     -- ⑦
    COALESCE(EXTRACT(DAY FROM NOW() - lo.last_at)::int, 9999)       AS day_since_last_order,
    COALESCE(ao.cnt, 0)                                             AS order_count,      -- ③ (=1)
    COALESCE(lo.spend, 0)                                           AS total_spend,
    COALESCE(ca.cnt, 0)                                             AS cart_abandon_count,   -- ①
    COALESCE(wi.cnt, 0)                                             AS wishlist_idle_count,  -- ④
    COALESCE(ce.cnt, 0)                                             AS coupon_unused_count,  -- ⑤
    COALESCE(br.cnt, 0)                                             AS bad_review_count,     -- ⑥
    COALESCE(cc.cnt, 0)                                             AS cancel_count,         -- ⑥
    CASE WHEN COALESCE(sw.prev30, 0) > 0
         THEN ROUND((COALESCE(sw.recent30, 0)::numeric / sw.prev30), 2)
         ELSE 1.0 END                                               AS spending_drop_ratio,  -- ⑧
    s.score                                                         AS satisfaction_score    -- NULL = 미응답
FROM users u
LEFT JOIN last_ok       lo ON lo.user_id = u.user_id
LEFT JOIN all_orders    ao ON ao.user_id = u.user_id
LEFT JOIN spend_windows sw ON sw.user_id = u.user_id
LEFT JOIN cart_abandon  ca ON ca.user_id = u.user_id
LEFT JOIN wish_idle     wi ON wi.user_id = u.user_id
LEFT JOIN coupon_exp    ce ON ce.user_id = u.user_id
LEFT JOIN bad_reviews   br ON br.user_id = u.user_id
LEFT JOIN cancels       cc ON cc.user_id = u.user_id
LEFT JOIN sat           s  ON s.user_id  = u.user_id
WHERE u.role = 'ROLE_USER'
ORDER BY u.user_id;
