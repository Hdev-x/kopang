-- Kopang DDL (자동 추출: docs/DB_스키마_DDL.md — 원본 수정 시 재추출)
-- 29개 테이블 + 인덱스 8개 · 검증: PostgreSQL 18 통과 (2026-07-02)

-- ============ 1. 회원 ============
CREATE TABLE users (
    user_id        BIGSERIAL PRIMARY KEY,
    email          VARCHAR(100) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    name           VARCHAR(50)  NOT NULL,
    phone          VARCHAR(20),
    birth_date     DATE,
    role           VARCHAR(20)  NOT NULL DEFAULT 'USER',      -- USER / ADMIN
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',    -- ACTIVE / DELETE
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_login_at  TIMESTAMP                                  -- ⑦ 접속뜸 신호
);

CREATE TABLE user_address (
    address_id     BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users(user_id),
    receiver       VARCHAR(50) NOT NULL,
    phone          VARCHAR(20),
    zipcode        VARCHAR(10),
    address        TEXT NOT NULL,
    detail_address TEXT,
    is_default     BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============ 2. 상품 ============
CREATE TABLE categories (
    category_id  BIGSERIAL PRIMARY KEY,
    parent_id    BIGINT REFERENCES categories(category_id),   -- NULL = 대분류
    depth        INT NOT NULL DEFAULT 1,                      -- 1 대 / 2 중 / 3 소
    name         VARCHAR(50) NOT NULL
);

CREATE TABLE products (
    product_id     BIGSERIAL PRIMARY KEY,
    category_id    BIGINT NOT NULL REFERENCES categories(category_id),
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    price          INT NOT NULL,
    discount_price INT,
    stock          INT NOT NULL DEFAULT 0,
    image_url      TEXT,
    status         VARCHAR(20) NOT NULL DEFAULT 'FOR_SALE',
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_images (
    image_id   BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(product_id),
    url        TEXT NOT NULL
);

-- ============ 3. 검색 / 행동 데이터 ============
CREATE TABLE search_history (
    search_id   BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(user_id),
    keyword     VARCHAR(200) NOT NULL,
    searched_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_view_history (
    view_id    BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(user_id),
    product_id BIGINT NOT NULL REFERENCES products(product_id),
    viewed_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist (
    wishlist_id BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(user_id),
    product_id  BIGINT NOT NULL REFERENCES products(product_id),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),             -- ④ 찜방치 기준 시각
    UNIQUE (user_id, product_id)
);

-- ============ 4. 장바구니 ============
CREATE TABLE cart (
    cart_id    BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL UNIQUE REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_item (
    cart_item_id BIGSERIAL PRIMARY KEY,
    cart_id      BIGINT NOT NULL REFERENCES cart(cart_id),
    product_id   BIGINT NOT NULL REFERENCES products(product_id),
    quantity     INT NOT NULL DEFAULT 1,
    added_at     TIMESTAMP NOT NULL DEFAULT NOW()             -- ① 장바구니방치 기준 시각
);

-- ============ 5. 주문 ============
CREATE TABLE orders (
    order_id       BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users(user_id),
    total_price    INT NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PAID',
    payment_key    VARCHAR(200),                              -- PG 결제키(토스, mock이면 NULL)
    order_status   VARCHAR(30) NOT NULL DEFAULT 'ORDERED',
        -- ORDERED / PAID / SHIPPING / DELIVERED / CANCELLED / RETURNED (취소·반품 = ⑥ 부정경험 신호)
    ordered_at     TIMESTAMP NOT NULL DEFAULT NOW()           -- ③⑧ 첫구매미복귀·구매액감소 기준
);

CREATE TABLE orders_item (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id      BIGINT NOT NULL REFERENCES orders(order_id),
    product_id    BIGINT NOT NULL REFERENCES products(product_id),
    quantity      INT NOT NULL,
    price         INT NOT NULL
);

-- ============ 6. 리뷰 / 포인트 ============
CREATE TABLE reviews (
    review_id  BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(user_id),
    product_id BIGINT NOT NULL REFERENCES products(product_id),
    rating     FLOAT NOT NULL,                                -- ⑥ 평점≤2 = 부정경험 신호
    content    TEXT,
    image      TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE point_history (
    point_id    BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(user_id),
    amount      INT NOT NULL,                                 -- +적립 / -사용
    type        VARCHAR(20) NOT NULL,                         -- 적립/사용/이벤트/리뷰
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============ 7. 쿠폰 ============
CREATE TABLE coupons (
    coupon_id      BIGSERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    discount_type  VARCHAR(20) NOT NULL,                      -- RATE / AMOUNT
    discount_value INT NOT NULL,
    start_date     DATE,
    end_date       DATE,
    quantity       INT
);

CREATE TABLE user_coupons (
    user_coupon_id BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users(user_id),
    coupon_id      BIGINT NOT NULL REFERENCES coupons(coupon_id),
    used           BOOLEAN NOT NULL DEFAULT FALSE,
    issued_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at     DATE NOT NULL,                             -- ⑤ 쿠폰만료임박 감지 기준
    used_at        TIMESTAMP                                  -- 대응 효과 측정용
);

-- ============ 8. 멤버십 ============
CREATE TABLE membership (
    membership_id BIGSERIAL PRIMARY KEY,
    name          VARCHAR(50) NOT NULL,
    price         INT NOT NULL,
    discount_rate INT NOT NULL DEFAULT 0,
    description   TEXT
);

CREATE TABLE user_membership (
    user_membership_id BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(user_id),
    membership_id BIGINT NOT NULL REFERENCES membership(membership_id),
    start_date    DATE NOT NULL,
    end_date      DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',      -- ACTIVE / EXPIRED / CANCELLED
    cancelled_at  TIMESTAMP                                   -- ② 멤버십해지 신호
);

-- ============ 9. AI 추천 / 챗봇 / 행동로그 ============
CREATE TABLE recommendation_history (
    recommend_id BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(user_id),
    product_id   BIGINT NOT NULL REFERENCES products(product_id),
    reason       TEXT,
    score        FLOAT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    shown        BOOLEAN NOT NULL DEFAULT FALSE,
    clicked      BOOLEAN NOT NULL DEFAULT FALSE,
    converted    BOOLEAN NOT NULL DEFAULT FALSE,
    order_id     BIGINT REFERENCES orders(order_id)           -- 귀속 주문(nullable)
);

CREATE TABLE chatbot_history (
    chat_id    BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(user_id),
    question   TEXT NOT NULL,
    answer     TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_behavior_log (
    log_id     BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(user_id),
    action     VARCHAR(50) NOT NULL,                          -- VIEW / SEARCH / LOGIN ...
    target_id  BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============ 10. 이탈 예측 / 대응 / 측정 ============
CREATE TABLE churn_score (
    churn_score_id BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(user_id),
    score         FLOAT NOT NULL,                             -- 이탈확률 0~1
    risk_level    VARCHAR(10) NOT NULL,                       -- LOW / MID / HIGH
    risk_type     VARCHAR(30),                                -- 위험 유형 8종 (룰 감지 시)
    source        VARCHAR(10) NOT NULL,                       -- RULE / ML
    model_version VARCHAR(20),
    scored_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE retention_intervention (
    intervention_id BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users(user_id),
    churn_score_id BIGINT REFERENCES churn_score(churn_score_id),
    risk_type      VARCHAR(30) NOT NULL,
        -- CART_ABANDON / MEMBERSHIP_CANCEL / FIRST_ORDER_ONLY / WISHLIST_IDLE
        -- / COUPON_EXPIRING / BAD_EXPERIENCE / LOGIN_INACTIVE / SPENDING_DROP / ML_HIGH
    action_type    VARCHAR(20) NOT NULL,                      -- COUPON / PUSH / RECOMMEND / MODAL
    ref_id         BIGINT,                                    -- 액션 대상(쿠폰·상품 id)
    is_control     BOOLEAN NOT NULL DEFAULT FALSE,            -- 대조군(무처치)
    channel        VARCHAR(20),                               -- PUSH / EMAIL / IN_APP
    status         VARCHAR(20) NOT NULL DEFAULT 'SENT',       -- SENT / FAILED
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE intervention_outcome (
    outcome_id      BIGSERIAL PRIMARY KEY,
    intervention_id BIGINT NOT NULL UNIQUE REFERENCES retention_intervention(intervention_id),
    converted       BOOLEAN NOT NULL DEFAULT FALSE,           -- 윈도우 내 구매
    order_id        BIGINT REFERENCES orders(order_id),
    revenue_amount  INT NOT NULL DEFAULT 0,
    retained        BOOLEAN,
    window_days     INT NOT NULL DEFAULT 7,
    measured_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE churn_daily_metric (
    metric_date        DATE PRIMARY KEY,
    total_users        INT NOT NULL,
    at_risk_high       INT NOT NULL,
    at_risk_mid        INT NOT NULL,
    churn_rate         FLOAT,
    intervention_count INT NOT NULL DEFAULT 0,
    conversion_count   INT NOT NULL DEFAULT 0,
    attributed_revenue INT NOT NULL DEFAULT 0,
    retained_count     INT NOT NULL DEFAULT 0
);

-- ============ 11. CS / 알림 ============
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(user_id),
    type       VARCHAR(20) NOT NULL,
        -- ABANDON / REBUY / WISHLIST / COUPON_EXPIRE / WELCOME_BACK / APOLOGY / COMEBACK / RECOMMEND / NOTICE
    message    TEXT NOT NULL,
    ref_id     BIGINT,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    clicked    BOOLEAN NOT NULL DEFAULT FALSE,                -- 대응 반응 추적
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE inquiries (
    inquiry_id BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(user_id),
    type       VARCHAR(20) NOT NULL,                          -- PRODUCT / GENERAL
    product_id BIGINT REFERENCES products(product_id),
    title      VARCHAR(200) NOT NULL,
    content    TEXT NOT NULL,
    answer     TEXT,
    status     VARCHAR(20) NOT NULL DEFAULT '답변대기',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notices (
    notice_id  BIGSERIAL PRIMARY KEY,
    title      VARCHAR(200) NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============ 11-1. 만족도 조사 ============
CREATE TABLE satisfaction_survey (
    survey_id  BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(user_id),
    score      INT NOT NULL CHECK (score BETWEEN 1 AND 5),   -- 서비스(페이지) 만족도 별점
    context    VARCHAR(20) NOT NULL,                          -- ORDER(주문완료) / CANCEL(해지) / CS
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============ 12. 인덱스 (룰 배치 쿼리용) ============
CREATE INDEX idx_orders_user_date        ON orders(user_id, ordered_at);          -- ③⑧
CREATE INDEX idx_cart_item_added         ON cart_item(added_at);                  -- ①
CREATE INDEX idx_wishlist_created        ON wishlist(created_at);                 -- ④
CREATE INDEX idx_user_coupons_expire     ON user_coupons(expires_at) WHERE used = FALSE;  -- ⑤
CREATE INDEX idx_users_last_login        ON users(last_login_at);                 -- ⑦
CREATE INDEX idx_churn_score_user        ON churn_score(user_id, scored_at);
CREATE INDEX idx_intervention_user       ON retention_intervention(user_id, created_at);
CREATE INDEX idx_notifications_user      ON notifications(user_id, is_read);
