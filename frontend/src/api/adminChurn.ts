import { client } from "./client";
import type { ApiResponse } from "../types/api";

// 위험 고객 1행 — 백엔드 RiskCustomerResponse와 1:1
export type RiskCustomer = {
  userId: number;
  name: string;
  isMember: boolean;
  score: number;
  riskLevel: "HIGH" | "MID" | "LOW";
  riskType: string;
  detectedAt: string; // ISO date
  status: "SCHEDULED" | "SENT" | "CONTROL";
};

export type RiskCustomerList = {
  content: RiskCustomer[];
  totalElements: number;
};

// 위험 고객 목록 (GET /api/admin/churn/customers). 필터·페이징 옵션
export async function getRiskCustomers(params: {
  type?: string; // 위험 유형 8종 / ML_HIGH
  memberType?: string; // MEMBER / NORMAL
  level?: string; // HIGH / MID / LOW
  page?: number;
  size?: number;
}) {
  const res = await client.get<ApiResponse<RiskCustomerList>>("/admin/churn/customers", { params });
  return res.data.data;
}
