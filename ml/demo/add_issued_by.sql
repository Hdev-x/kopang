-- user_coupons 발급 출처 컬럼 추가 (2026-07-29)
--
-- 왜 필요한가:
--   이탈 대응 원복(관리자 [원상 복구])이 "배치가 발급한 쿠폰"만 회수해야 하는데,
--   출처를 적는 컬럼이 없어 "오늘 대응받은 회원에게 오늘 발급된 쿠폰 전부"로 골라내고 있었다.
--   같은 날 이벤트 쿠폰을 받은 사람이 대응 대상이기도 하면 그 쿠폰까지 삭제되고 재고가 늘어난다.
--
-- 영향:
--   NULL 허용이라 기존 INSERT/SELECT 에 영향 없다. 이탈방지 발급 경로만 'CHURN' 을 쓴다.
--   다른 발급 경로(이벤트·회원가입 등)는 NULL 로 남고, 원복 대상에서 제외된다.

ALTER TABLE user_coupons ADD COLUMN IF NOT EXISTS issued_by VARCHAR(20);

COMMENT ON COLUMN user_coupons.issued_by IS '발급 출처 (CHURN=이탈방지 배치, NULL=그 외)';

-- 확인
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_name = 'user_coupons' AND column_name = 'issued_by';

-- 되돌리기
-- ALTER TABLE user_coupons DROP COLUMN issued_by;
