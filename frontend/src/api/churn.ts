import { client } from "./client";
import type { ApiResponse } from "../types/api";

// 이탈 대시보드 집계 응답 — 백엔드 ChurnSummaryResponse와 1:1 대응
export type ChurnKpi = {
  highRiskCount: number; // 고위험 고객 수
  churnRate: number; // 주간 이탈율(%)
  conversionRate: number; // 대응 전환율(%)
  attributedRevenue: number; // 대응 귀속 매출
};

export type ChurnLevelCount = {
  riskLevel: "HIGH" | "MID" | "LOW";
  count: number;
};

// 위험 유형별 인원 — riskType null = ML 예측. 집계 기준: 현재 상태(유저별 최신 1건, 임시)
export type ChurnTypeCount = {
  riskType: string | null;
  count: number;
};

export type ChurnSegmentCount = {
  segment: "MEMBER" | "NORMAL";
  total: number;
  high: number;
};

export type ChurnTrendPoint = {
  metricDate: string; // ISO date
  churnRate: number;
};

export type ChurnEffectRow = {
  actionType: "COUPON" | "PUSH" | "MODAL" | "RECOMMEND";
  treatPct: number; // 처치군 전환율(%)
  controlPct: number; // 대조군 전환율(%)
  revenue: number;
};

export type ChurnAtRiskCustomer = {
  userId: number;
  name: string;
  score: number;
  riskLevel: "HIGH" | "MID" | "LOW";
  riskType: string;
  isMember: boolean;
};

export type ChurnSummary = {
  kpi: ChurnKpi;
  levelCounts: ChurnLevelCount[];
  typeCounts: ChurnTypeCount[];
  segments: ChurnSegmentCount[];
  weeklyChurnRate: ChurnTrendPoint[];
  effect: ChurnEffectRow[];
  atRisk: ChurnAtRiskCustomer[];
};

// 이탈 대시보드 요약 집계 (GET /api/admin/churn/summary)
export async function getChurnSummary() {
  const res = await client.get<ApiResponse<ChurnSummary>>("/admin/churn/summary");
  return res.data.data;
}

// ─── 대응 발송 실행 (A-1 대시보드 액션센터) ───

// 발송 실행 전 대상 현황 — 백엔드 InterventionPreviewResponse와 1:1 대응
export type InterventionPreview = {
  integratedCount: number; // 통합 발송 (FIRST_ORDER_ONLY)
  couponExpiringCount: number; // 쿠폰 만료 임박 (CHURN-14)
  loginInactiveCount: number; // 미로그인 복귀 유도 (CHURN-16)
};

// 통합 발송 실행 결과 — 백엔드 InterventionRunResult와 1:1 대응
export type InterventionRunResult = {
  targetCount: number; // 발송 후보 전원
  sentCount: number; // 처치군(실제 발송)
  controlCount: number; // 대조군 + 정책 제외
};

// 발송 대상 현황 조회 (GET /api/admin/churn/intervene/preview)
export async function getInterventionPreview() {
  const res = await client.get<ApiResponse<InterventionPreview>>("/admin/churn/intervene/preview");
  return res.data.data;
}

// 통합 발송 실행 (POST /api/admin/churn/intervene)
export async function runIntervention() {
  const res = await client.post<ApiResponse<InterventionRunResult>>("/admin/churn/intervene");
  return res.data.data;
}

// 쿠폰 만료 임박 발송 실행 (POST /api/admin/churn/intervene/coupon-expiring)
export async function runCouponExpiringIntervention() {
  await client.post<ApiResponse<{ message: string }>>("/admin/churn/intervene/coupon-expiring");
}

// 미로그인 복귀 유도 발송 실행 (POST /api/admin/churn/intervene/login-inactive)
export async function runLoginInactiveIntervention() {
  await client.post<ApiResponse<{ message: string }>>("/admin/churn/intervene/login-inactive");
}
