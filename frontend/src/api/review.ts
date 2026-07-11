import { client } from "./client";
import type { ApiResponse } from "../types/api";

export interface Review {
  reviewId: number;
  userId: number;
  userName: string;
  productId: number;
  rating: number;
  content: string;
  image?: string;
  createdAt: string;
}

// 특정 상품의 리뷰 목록 조회
export async function getProductReviews(productId: number) {
  const res = await client.get<ApiResponse<Review[]>>(`/products/${productId}/reviews`);
  return res.data.data;
}

// 리뷰 작성
export async function createProductReview(
  productId: number,
  reviewData: { rating: number; content: string; imageUrl?: string }
) {
  const res = await client.post<ApiResponse<void>>(`/products/${productId}/reviews`, reviewData);
  return res.data;
}
