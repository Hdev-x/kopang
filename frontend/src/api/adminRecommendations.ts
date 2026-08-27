import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type RecommendationResultItem = {
  recommendId: number;
  userName: string;
  productName: string;
  score: number;
  reason: string;
  shown: boolean;
  clicked: boolean;
  converted: boolean;
};

export type RecommendationPerformance = {
  recommendationCount: number;
  shownCount: number;
  clickCount: number;
  conversionCount: number;
  clickRate: number | null;
  conversionRate: number | null;
  revenue: number;
  items: RecommendationResultItem[];
};

export async function getRecommendationPerformance() {
  const response =
    await client.get<ApiResponse<RecommendationPerformance>>("/admin/recommendations");
  return response.data.data;
}
