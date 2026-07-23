import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type RecentProductView = {
  productId: number;
  name: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
  viewedAt: string;
};

export async function recordProductView(productId: number) {
  await client.post(`/product-views/${productId}`);
}

export async function getRecentProductViews(limit = 20) {
  const response = await client.get<ApiResponse<RecentProductView[]>>("/product-views", {
    params: { limit },
  });
  return response.data.data;
}
