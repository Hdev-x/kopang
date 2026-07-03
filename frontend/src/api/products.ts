import { client } from "./client";
import type { ApiResponse, Page } from "../types/api";
import type { Product } from "../types/product";

// 상품 목록 (GET /api/products?cat=<카테고리id>&keyword=<검색어>)
export async function getProducts(categoryId?: number, page: number = 0, size: number = 20, keyword?: string) {
  const res = await client.get<ApiResponse<Page<Product>>>("/products", {
    params: {
      ...(categoryId != null ? { cat: categoryId } : {}),
      ...(keyword ? { keyword } : {}),
      page,
      size,
    },
  });
  return res.data.data; // Page<Product>
}

// 상품 상세 (GET /api/products/:id)
export async function getProduct(id: number) {
  const res = await client.get<ApiResponse<Product>>(`/products/${id}`);
  return res.data.data; // Product
}
