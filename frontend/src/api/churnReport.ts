import { client } from "./client";
import type { ApiResponse } from "../types/api";

// 대응 효과 리포트 — 백엔드 ChurnReportResponse와 1:1
export type ChurnReportKpi = {
  treated: number; // 대응한 위험 고객(처치 건수)
  conversions: number; // 전환(재구매) 건수
  revenue: number; // 귀속 매출 합
  defended: number; // 방어한 이탈(잔존) 수
};

export type ChurnReportEffect = {
  actionType: "COUPON" | "PUSH" | "MODAL" | "RECOMMEND";
  treatPct: number; // 처치군 전환율(%)
  controlPct: number; // 대조군 전환율(%)
  conv: number; // 처치군 전환 명수
  revenue: number;
  treatN: number; // 처치군 인원
  controlN: number; // 대조군 인원
  controlConv: number; // 대조군 전환 명수
};

// 위험 유형별 순효과 — 백엔드 TypeEffectRow와 1:1
export type ChurnTypeEffect = {
  riskType: string | null; // null = ML
  treatPct: number;
  controlPct: number;
  treated: number; // = treatN
  treatConv: number;
  controlN: number;
  controlConv: number;
};

// 일별 대응·전환 추이
export type ChurnDailyPoint = {
  day: string; // ISO date
  sent: number;
  converted: number;
};

// 이탈 대응 쿠폰 ROI (비용은 추정)
export type ChurnCouponRoi = {
  name: string;
  discountType: "RATE" | "AMOUNT";
  discountValue: number;
  issued: number;
  used: number;
  estimatedCost: number;
};

export type ChurnReport = {
  kpi: ChurnReportKpi;
  effect: ChurnReportEffect[];
  typeEffect: ChurnTypeEffect[];
  dailyTrend: ChurnDailyPoint[];
  couponRoi: ChurnCouponRoi[];
};

// 대응 효과 리포트 (GET /api/admin/churn/report?from=&to=)
export async function getChurnReport(from?: string, to?: string) {
  const res = await client.get<ApiResponse<ChurnReport>>("/admin/churn/report", {
    params: { from, to },
  });
  return res.data.data;
}
