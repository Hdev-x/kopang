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

