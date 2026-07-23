import { client } from "./client";
import type { ApiResponse } from "../types/api";

// 대응 이력 1건 — 백엔드 InterventionLogResponse와 1:1
export type InterventionLog = {
  createdAt: string; // ISO datetime
  userName: string;
  actionType: string; // COUPON / PUSH / MODAL / RECOMMEND
  channel: string; // PUSH / EMAIL / IN_APP
  isControl: boolean;
  riskType: string;
  outcome: "CONTROL" | "CONVERTED" | "NO_RESPONSE"; // 서버 계산 결과
};

// 대응 이력 조회 (GET /api/admin/interventions?type=)
export async function getInterventionLogs(type?: string) {
  const res = await client.get<ApiResponse<InterventionLog[]>>("/admin/interventions", {
    params: type ? { type } : undefined,
  });
  return res.data.data;
}
