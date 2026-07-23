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
};

export type ChurnReport = {
  kpi: ChurnReportKpi;
  effect: ChurnReportEffect[];
};

// 대응 효과 리포트 (GET /api/admin/churn/report?from=&to=)
export async function getChurnReport(from?: string, to?: string) {
  const res = await client.get<ApiResponse<ChurnReport>>("/admin/churn/report", {
    params: { from, to },
  });
  return res.data.data;
}
