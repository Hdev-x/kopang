import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type HomeBannerRebuy = {
  productId: number;
  productName: string;
};

export type HomeBanners = {
  cartAbandon: boolean; // 배너①: 장바구니 방치 리마인더 노출 여부
  rebuy: HomeBannerRebuy | null; // 배너②: 재구매 배너 상품 (null이면 미노출)
};

// 홈 배너 노출 판단 (GET /api/churn/home-banners) — 로그인 사용자 기준
export async function getHomeBanners() {
  const response = await client.get<ApiResponse<HomeBanners>>("/churn/home-banners");
  return response.data.data;
}
