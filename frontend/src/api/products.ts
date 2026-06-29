import { client } from "./client";
import type { ApiResponse, Page } from "../types/api";
import type { Product } from "../types/product";

// 상품 목록 (GET /api/products)
export async function getProducts() {
  const res = await client.get<ApiResponse<Page<Product>>>("/products");
  return res.data.data; // Page<Product>
}

// 상품 상세 (GET /api/products/:id)
export async function getProduct(id: number) {
  const res = await client.get<ApiResponse<Product>>(`/products/${id}`);
  return res.data.data; // Product
}
