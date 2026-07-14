import type { QnaPost } from "../types/qna";

// 1:1 문의(질문답변 게시판) 목 데이터
export const qnaPosts: QnaPost[] = [
  {
    id: 1,
    title: "배송이 너무 늦어요",
    content: "주문한 지 5일째인데 아직도 배송중이에요. 확인 부탁드립니다.",
    author: "김**",
    status: "답변완료",
    createdAt: "2026.06.28",
    answerContent:
      "안녕하세요 고객님, 해당 주문은 6/29 출고되어 금일 도착 예정입니다. 불편을 드려 죄송합니다.",
  },
  {
    id: 2,
    title: "포인트가 적립이 안 됐어요",
    content: "리뷰를 작성했는데 포인트가 들어오지 않았습니다.",
    author: "이**",
    status: "답변완료",
    createdAt: "2026.06.27",
    answerContent: "리뷰 적립은 영업일 기준 1~2일 소요됩니다. 확인 결과 6/28 적립 완료되었습니다.",
  },
  {
    id: 3,
    title: "멤버십 해지 방법 문의",
    content: "WOW 멤버십을 해지하고 싶은데 어디서 하나요?",
    author: "박**",
    status: "답변대기",
    createdAt: "2026.06.30",
  },
];
