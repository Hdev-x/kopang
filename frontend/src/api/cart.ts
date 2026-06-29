import { client } from "./client";
import type { ApiResponse } from "../types/api";
import type { CartItem } from "../types/cart";

// 내 장바구니 (GET /api/cart)
export async function getCart() {
  const res = await client.get<ApiResponse<CartItem[]>>("/cart");
  return res.data.data;
}
