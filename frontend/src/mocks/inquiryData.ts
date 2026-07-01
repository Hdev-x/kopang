// 문의 목업 데이터 — 목록(MyInquiriesPage)과 상세(MyInquiryDetailPage)가 공유
export type Inquiry = {
  id: string;
  type: "product" | "general"; // 상품문의 / 일반문의
  product?: string; // 상품문의일 때 상품명
  title: string;
  question: string;
  answer: string | null; // null = 답변 대기
  date: string;
  status: "답변완료" | "답변대기";
};

export const INQUIRIES: Inquiry[] = [
  {
    id: "p1",
    type: "product",
    product: "유기농 오이 3입",
    title: "재고 언제 다시 들어오나요?",
    question: "품절이라고 떠서요. 언제쯤 다시 구매할 수 있을까요?",
    answer:
      "안녕하세요 고객님. 해당 상품은 이번 주 내 입고 예정입니다. 입고 알림을 설정해두시면 재입고 시 안내드릴게요.",
    date: "2026-06-29",
    status: "답변완료",
  },
  {
    id: "p2",
    type: "product",
    product: "제주 삼다수 2L x6",
    title: "유통기한이 어떻게 되나요?",
    question: "받아보면 유통기한이 얼마나 남아있는지 궁금합니다.",
    answer: null,
    date: "2026-06-30",
    status: "답변대기",
  },
  {
    id: "g1",
    type: "general",
    title: "배송이 안 와요",
    question: "주문한 지 3일째인데 아직 배송 출발을 안 했어요. 확인 부탁드립니다.",
    answer:
      "불편을 드려 죄송합니다. 확인 결과 오늘 출고 예정이며 내일 중 도착 예정입니다. 지연 보상으로 포인트를 적립해드렸어요.",
    date: "2026-06-28",
    status: "답변완료",
  },
  {
    id: "g2",
    type: "general",
    title: "환불 절차 문의",
    question: "단순 변심으로 환불하고 싶은데 어떻게 하나요?",
    answer: null,
    date: "2026-06-30",
    status: "답변대기",
  },
];
