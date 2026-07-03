import { client } from "./client";
import type { ApiResponse } from "../types/api";
import type { CartItem } from "../types/cart";

// 내 장바구니 (GET /api/cart)
export async function getCart() {
  const res = await client.get<ApiResponse<CartItem[]>>("/cart");
  return res.data.data;
}

// 장바구니 담기 (POST /api/cart)
export async function addToCart(productId: number, quantity: number = 1) {
  const res = await client.post<ApiResponse<void>>("/cart", { productId, quantity });
  return res.data;
}

// 장바구니 수량 수정 (PUT /api/cart/:id?quantity=)
export async function updateCartItem(itemId: number, quantity: number) {
  const res = await client.put<ApiResponse<void>>(`/cart/${itemId}`, null, {
    params: { quantity },
  });
  return res.data;
}

// 장바구니 아이템 삭제 (DELETE /api/cart/:id)
export async function deleteCartItem(itemId: number) {
  const res = await client.delete<ApiResponse<void>>(`/cart/${itemId}`);
  return res.data;
}
