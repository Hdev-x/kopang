export type QnaAnswer = {
  content: string;
  createdAt: string;
};

export type QnaPost = {
  id: number;
  title: string;
  content: string;
  author: string; // 마스킹된 작성자 (예: 김**)
  status: "답변대기" | "답변완료";
  createdAt: string;
  answer?: QnaAnswer;
};

// 목록용 요약 (본문·답변 제외)
export type QnaSummary = Omit<QnaPost, "content" | "answer">;
