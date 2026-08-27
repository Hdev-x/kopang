CREATE TABLE IF NOT EXISTS faqs (
    faq_id BIGSERIAL PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO faqs (question, answer, category)
SELECT seed.question, seed.answer, seed.category
FROM (
    VALUES
        ('배송은 얼마나 걸리나요?', '주문 후 보통 1~2일 내 도착하며, WOW 멤버십은 무료배송이에요.', '배송'),
        ('반품/교환은 어떻게 하나요?', '주문내역에서 신청할 수 있고, 멤버십 회원은 무료 반품이 가능해요.', '반품/교환'),
        ('포인트는 어떻게 적립되나요?', '구매 시 2%, 리뷰 작성 시 추가로 적립됩니다.', '포인트'),
        ('쿠폰은 어디서 확인하나요?', '마이페이지 > 쿠폰함에서 보유 쿠폰을 확인할 수 있어요.', '쿠폰'),
        ('주문 취소는 어떻게 하나요?', '배송 준비 전이라면 주문내역에서 바로 취소할 수 있어요.', '주문'),
        ('멤버십은 언제든 해지할 수 있나요?', '네, 마이페이지 > WOW 멤버십에서 언제든 해지 가능하며 남은 기간까지 혜택이 유지됩니다.', '멤버십')
) AS seed(question, answer, category)
WHERE NOT EXISTS (
    SELECT 1
    FROM faqs faq
    WHERE faq.question = seed.question
);
