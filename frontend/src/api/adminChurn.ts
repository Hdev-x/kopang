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

// ─── 위험 고객 상세 (B-2) — 백엔드 RiskCustomerDetailResponse와 1:1 ───

export type RiskCustomerProfile = {
  userId: number;
  name: string;
  email: string;
  isMember: boolean;
  joinedAt: string; // ISO date
  lastLoginAt: string | null;
};

export type RiskScorePoint = {
  scoredAt: string;
  score: number;
  riskLevel: "HIGH" | "MID" | "LOW";
  riskType: string;
  source: "RULE" | "ML";
};

export type RiskInterventionItem = {
  createdAt: string;
  riskType: string;
  actionType: string;
  channel: string;
  isControl: boolean;
  outcome: "CONTROL" | "CONVERTED" | "NO_RESPONSE";
};

export type RiskOrderSummary = {
  orderCount: number;
  totalSpent: number;
  avgAmount: number;
  lastOrderedAt: string | null;
};

export type RiskCustomerDetail = {
  profile: RiskCustomerProfile;
  signals: RiskSignalSummary[];
  satisfaction: RiskSatisfaction | null;
  interestProducts: RiskInterestProduct[];
  scoreHistory: RiskScorePoint[];
  interventions: RiskInterventionItem[];
  orderSummary: RiskOrderSummary;
};

// 위험 고객 상세 (GET /api/admin/churn/customers/{userId})
export async function getRiskCustomerDetail(userId: number) {
  const res = await client.get<ApiResponse<RiskCustomerDetail>>(`/admin/churn/customers/${userId}`);
  return res.data.data;
}

// 최근 만족도 1건 — 백엔드 Satisfaction과 1:1 (CHURN-17 satisfaction_survey 최신 1건)
export type RiskSatisfaction = {
  score: number; // 1~5
  context: string;
  reason: string | null; // 사유(선택) — null = 미선택
  createdAt: string;
};

// 현재 관심 상품 — 백엔드 InterestProduct와 1:1 (장바구니·찜)
export type RiskInterestProduct = {
  source: "CART" | "WISHLIST";
  productId: number;
  name: string;
  imageUrl: string;
  price: number;
  discountPrice: number | null; // 할인 없으면 null
};

// 위험 신호 유형별 요약 — 백엔드 SignalSummary와 1:1 (전체 기간 집계)
export type RiskSignalSummary = {
  riskType: string | null; // null = ML 예측
  source: "RULE" | "ML";
  latestScore: number;
  latestLevel: "HIGH" | "MID" | "LOW";
  firstDetectedAt: string;
  lastDetectedAt: string;
  detectCount: number;
  lastInterventionAt: string | null; // null = 대응 없음
  lastOutcome: "CONTROL" | "CONVERTED" | "NO_RESPONSE" | null;
};
