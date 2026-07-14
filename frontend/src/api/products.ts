import { client } from "./client";
import type { ApiResponse, Page } from "../types/api";
import type { Product } from "../types/product";

// 상품 목록 (GET /api/products?cat=<카테고리id>&keyword=<검색어>&sort=<정렬기준>)
export async function getProducts(categoryId?: number, page: number = 0, size: number = 20, keyword?: string, sort?: string) {
  const res = await client.get<ApiResponse<Page<Product>>>("/products", {
    params: {
      ...(categoryId != null ? { cat: categoryId } : {}),
      ...(keyword ? { keyword } : {}),
      ...(sort ? { sort } : {}),
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

// 상품 등록 (POST /api/products)
export async function createProduct(productData: {
  categoryId: number;
  name: string;
  description: string;
  price: number;
  discountPrice: number;
  stock: number;
  imageUrl: string;
  status?: string;
  imageUrls?: string[];
}) {
  const res = await client.post<ApiResponse<number>>("/products", productData);
  return res.data.data; // 생성된 productId (number)
}

// 상품 수정 (PUT /api/products/:id)
export async function updateProduct(
  id: number,
  productData: {
    categoryId: number;
    name: string;
    description: string;
    price: number;
    discountPrice: number;
    stock: number;
    imageUrl: string;
    status?: string;
    imageUrls?: string[];
  }
) {
  const res = await client.put<ApiResponse<void>>(`/products/${id}`, productData);
  return res.data;
}

// 상품 삭제 (DELETE /api/products/:id)
export async function deleteProduct(id: number) {
  const res = await client.delete<ApiResponse<void>>(`/products/${id}`);
  return res.data;
}

// 상품 이미지 업로드 (POST /api/products/images)
export async function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await client.post<ApiResponse<string>>("/products/images", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data.data; // 업로드된 S3 URL 문자열 반환
}

// 검색 기록 DTO 타입 정의
export interface SearchHistory {
  searchId: number;
  userId: number;
  keyword: string;
  searchedAt: string;
}

// 검색어 추가
export async function addSearchHistory(keyword: string) {
  const res = await client.post<ApiResponse<void>>("/products/search-history", { keyword });
  return res.data;
}

// 최근 검색어 목록 조회
export async function getSearchHistory() {
  const res = await client.get<ApiResponse<SearchHistory[]>>("/products/search-history");
  return res.data.data;
}

// 검색 기록 단건 삭제
export async function deleteSearchHistory(searchId: number) {
  const res = await client.delete<ApiResponse<void>>(`/products/search-history/${searchId}`);
  return res.data;
}

// 검색 기록 전체 삭제
export async function clearSearchHistory() {
  const res = await client.delete<ApiResponse<void>>("/products/search-history");
  return res.data;
}

// AI 상품 검색 (GET /api/products/ai-search?q=)
export async function searchProductsAI(query: string, page: number = 0, size: number = 20) {
  const res = await client.get<ApiResponse<Page<Product>>>("/products/ai-search", {
    params: { q: query, page, size },
  });
  return res.data.data;
}
