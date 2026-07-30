import { client } from "./client";
import type { ApiResponse } from "../types/api";
import type { QnaPost, QnaSummary } from "../types/qna";

// 문의 목록 (GET /api/inquiries)
export async function getQnaList(type?: "PRODUCT" | "GENERAL") {
  const res = await client.get<ApiResponse<QnaSummary[]>>("/inquiries", {
    params: type ? { type } : undefined,
  });
  return res.data.data;
}

// 관리자 전체 문의 목록
export async function getAdminQnaList() {
  const res =
    await client.get<ApiResponse<QnaSummary[]>>("/admin/inquiries");

  return res.data?.data ?? [];
}

// 관리자 문의 상세 조회
export async function getAdminQna(id: number) {
  const res = await client.get<ApiResponse<QnaPost>>(
    `/admin/inquiries/${id}`
  );

  return res.data.data;
}

// 상품별 문의 목록
export async function getProductQnaList(productId: number) {
  const res = await client.get<ApiResponse<QnaSummary[]>>(
    `/inquiries/product/${productId}`
  );
  return res.data?.data ?? [];
}


// 문의 상세 (GET /api/inquiries/:id)
export async function getQna(id: number) {
  const res = await client.get<ApiResponse<QnaPost>>(`/inquiries/${id}`);
  return res.data.data;
}

// 문의 작성 (POST /api/inquiries)

export async function createQna(
  title: string,
  content: string,
  type: "PRODUCT" | "GENERAL" = "GENERAL",
  productId?: number
) {
  const res = await client.post<ApiResponse<QnaPost>>("/inquiries", {
    title,
    content,
    type,
    productId,
  });
  return res.data.data;
}


export async function answerQna(id: number, answerContent: string) {
  await client.post<ApiResponse<null>>(`/inquiries/${id}/answer`, {
    answerContent,
  });

}
