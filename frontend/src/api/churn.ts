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
