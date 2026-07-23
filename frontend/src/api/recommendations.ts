import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type RecommendedProduct = {
  recommendId: number;
  productId: number;
  categoryId: number;
  name: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
  score: number;
  reason: string;
};

export type RecommendationList = {
  title: string;
  items: RecommendedProduct[];
};

export async function getRecommendations() {
  const response = await client.get<ApiResponse<RecommendationList>>("/recommendations");
  return response.data.data;
}

export async function markRecommendationShown(recommendId: number) {
  await client.post(`/recommendations/${recommendId}/shown`);
}

export async function markRecommendationClicked(recommendId: number) {
  await client.post(`/recommendations/${recommendId}/click`);
}
