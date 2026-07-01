import { client } from "./client";
import type { ApiResponse } from "../types/api";
import type { QnaPost, QnaSummary } from "../types/qna";

// 문의 목록 (GET /api/qna)
export async function getQnaList() {
  const res = await client.get<ApiResponse<QnaSummary[]>>("/qna");
  return res.data.data;
}

// 문의 상세 (GET /api/qna/:id)
export async function getQna(id: number) {
  const res = await client.get<ApiResponse<QnaPost>>(`/qna/${id}`);
  return res.data.data;
}

// 문의 작성 (POST /api/qna)
export async function createQna(title: string, content: string) {
  const res = await client.post<ApiResponse<QnaPost>>("/qna", { title, content });
  return res.data.data;
}
