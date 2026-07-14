import { client } from "./client";
import type { ApiResponse } from "../types/api";

export interface Wishlist {
  wishlistId: number;
  userId: number;
  productId: number;
  createdAt: string;
  name: string;
  price: number;
  imageUrl?: string;
  discountPrice?: number;
}

// 내 찜 목록 조회
export async function getWishlist() {
  const res = await client.get<ApiResponse<Wishlist[]>>("/wishlist");
  return res.data.data;
}

// 찜 등록
export async function addWishlist(productId: number) {
  const res = await client.post<ApiResponse<void>>("/wishlist", { productId });
  return res.data;
}

// 찜 해제
export async function deleteWishlist(productId: number) {
  const res = await client.delete<ApiResponse<void>>(`/wishlist/${productId}`);
  return res.data;
}

// 찜 여부 확인
export async function checkWishlist(productId: number) {
  const res = await client.get<ApiResponse<boolean>>(`/wishlist/check/${productId}`);
  return res.data.data;
}
