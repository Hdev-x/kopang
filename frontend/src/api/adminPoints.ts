import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type PointTier = "MEMBERSHIP" | "GENERAL";

export type PointTierStat = {
  tier: PointTier;
  memberCount: number;
  earnCount: number;
  earnedAmount: number;
  averageEarned: number;
  ratePercent: number;
};

export type PointLog = {
  pointId: number;
  userId: number;
  userName: string;
  tier: PointTier;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
};

export type PointStats = {
  totalEarned: number;
  totalUsed: number;
  totalBalance: number;
  earnCount: number;
  tiers: PointTierStat[];
  recentLogs: PointLog[];
};

export async function getPointStats() {
  const response = await client.get<ApiResponse<PointStats>>("/admin/points");
  return response.data.data;
}
