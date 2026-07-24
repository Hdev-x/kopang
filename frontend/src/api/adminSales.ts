import { client } from "./client";
import type { ApiResponse } from "../types/api";

// 일별 매출 1점
export type DailySales = {
  date: string; // ISO date
  amount: number;
};

// 매출 통계 — 백엔드 SalesStatsResponse와 1:1
export type SalesStats = {
  todaySales: number;
  todayOrders: number;
  newMembers: number;
  totalSales: number; // 전체 누적 매출
  monthSales: number; // 이번 달 매출
  weeklySales: DailySales[];
};

// 매출 통계 (GET /api/admin/stats/sales)
export async function getSalesStats() {
  const res = await client.get<ApiResponse<SalesStats>>("/admin/stats/sales");
  return res.data.data;
}
