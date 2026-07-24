import { client } from "./client";
import type { ApiResponse } from "../types/api";

// 사유 코드 ↔ 화면 표시 (2026-07-24 회의: 별점 입력 시 사유 수집)
export const SATISFACTION_REASONS = [
  { value: "DELIVERY", label: "배송" },
  { value: "QUALITY", label: "상품 품질" },
  { value: "PRICE", label: "가격" },
  { value: "SERVICE", label: "서비스·사용성" },
  { value: "ETC", label: "기타" },
] as const;

// 만족도 제출 (POST /api/satisfaction). context 기본 ORDER(주문완료), reason 선택
export async function submitSatisfaction(score: number, context: string = "ORDER", reason?: string) {
  await client.post("/satisfaction", { score, context, reason: reason ?? null });
}

// 조사 노출 가능 여부 (GET /api/satisfaction/eligibility) — 3개월 1회 정책
export async function getSatisfactionEligibility() {
  const res = await client.get<ApiResponse<boolean>>("/satisfaction/eligibility");
  return res.data.data;
}
