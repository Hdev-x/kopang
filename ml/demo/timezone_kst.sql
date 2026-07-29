-- ============================================================
-- DB 시각 기준을 UTC → KST(Asia/Seoul)로 전환
-- ============================================================
-- 배경: 컬럼 타입이 timestamp without time zone 이라 값에 타임존 정보가 없다.
--       지금까지 NOW()가 UTC를 반환해 UTC 시각이 그대로 저장됐다.
--       국내 서비스인데 "오늘 매출"의 하루가 한국 09:00~다음날 09:00 이었다.
--
-- 방법: ① 기존 값 전부 +9시간 (UTC 시각 → KST 시각)
--       ② DB 기본 타임존을 Asia/Seoul 로 변경 (이후 NOW()가 KST 반환)
--
-- 주의: ①과 ②를 반드시 함께 해야 한다. 하나만 하면 기존/신규 데이터가 9시간 어긋난다.
--       실행 중에는 팀원이 접속하지 않는 편이 좋다.
-- ============================================================

BEGIN;

-- ① 기존 시각 전부 +9시간
UPDATE cart                   SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE cart_item              SET added_at     = added_at     + INTERVAL '9 hours';
UPDATE chatbot_history        SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE churn_score            SET scored_at    = scored_at    + INTERVAL '9 hours';
UPDATE faqs                   SET created_at   = created_at   + INTERVAL '9 hours',
                                  updated_at   = updated_at   + INTERVAL '9 hours';
UPDATE inquiries              SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE intervention_outcome   SET measured_at  = measured_at  + INTERVAL '9 hours';
UPDATE notices                SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE notifications          SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE orders                 SET ordered_at   = ordered_at   + INTERVAL '9 hours';
UPDATE point_history          SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE product_view_history   SET viewed_at    = viewed_at    + INTERVAL '9 hours';
UPDATE products               SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE recommendation_history SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE retention_intervention SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE reviews                SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE satisfaction_survey    SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE search_history         SET searched_at  = searched_at  + INTERVAL '9 hours';
UPDATE user_behavior_log      SET created_at   = created_at   + INTERVAL '9 hours';
UPDATE user_coupons           SET issued_at    = issued_at    + INTERVAL '9 hours',
                                  used_at      = used_at      + INTERVAL '9 hours';
UPDATE user_membership        SET cancelled_at = cancelled_at + INTERVAL '9 hours';
UPDATE users                  SET created_at   = created_at   + INTERVAL '9 hours',
                                  last_login_at= last_login_at+ INTERVAL '9 hours',
                                  updated_at   = updated_at   + INTERVAL '9 hours';
UPDATE wishlist               SET created_at   = created_at   + INTERVAL '9 hours';

COMMIT;

-- ② DB 기본 타임존 변경 (트랜잭션 밖에서 실행)
--    새로 맺는 연결부터 NOW()·CURRENT_DATE 가 KST 기준이 된다 → 백엔드 재기동 필요
ALTER DATABASE postgres SET timezone = 'Asia/Seoul';

-- ③ 확인 — 재접속 후 실행할 것
-- SELECT NOW(), CURRENT_DATE, current_setting('TIMEZONE');
-- SELECT MAX(ordered_at) FROM orders;   -- 한국 현재 시각과 비슷해야 정상


-- ============================================================
-- 되돌리기 (문제가 생겼을 때)
-- ============================================================
-- ALTER DATABASE postgres SET timezone = 'UTC';
-- BEGIN;
-- UPDATE cart SET created_at = created_at - INTERVAL '9 hours';
--   ... (위 UPDATE 들의 + 를 - 로 바꿔 전부 실행)
-- COMMIT;
