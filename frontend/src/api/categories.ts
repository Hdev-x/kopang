import { client } from "./client";
import type { ApiResponse } from "../types/api";
import type { Category } from "../types/category";

// 카테고리 목록 (GET /api/categories)
export async function getCategories() {
  const res = await client.get<ApiResponse<Category[]>>("/categories");
  return res.data.data;
}
