import { client } from "./client";
import type { ApiResponse } from "../types/api";

export interface OrderItemRequest {
  productId: number;
  quantity: number;
  price: number;
}

export interface OrderRequest {
  totalPrice: number;
  items: OrderItemRequest[];
}

export interface OrderItem {
  orderItemId: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  name: string;
  imageUrl: string;
}

export interface Order {
  orderId: number;
  userId: number;
  totalPrice: number;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

// 1. 주문 생성 (POST /api/orders)
export async function createOrder(data: OrderRequest) {
  const res = await client.post<ApiResponse<number>>("/orders", data);
  return res.data.data;
}

// 2. 주문 내역 목록 조회 (GET /api/orders)
export async function getOrders() {
  const res = await client.get<ApiResponse<Order[]>>("/orders");
  return res.data.data;
}

// 3. 주문 상세 단건 조회 (GET /api/orders/:id)
export async function getOrderDetails(orderId: number) {
  const res = await client.get<ApiResponse<Order>>(`/orders/${orderId}`);
  return res.data.data;
}

// 4. 주문 취소 (POST /api/orders/:id/cancel)
export async function cancelOrder(orderId: number) {
  const res = await client.post<ApiResponse<void>>(`/orders/${orderId}/cancel`);
  return res.data;
}

// 주문 결제 상태 → 한글 레이블 변환
const STATUS_LABEL: Record<string, string> = {
  PENDING:   "결제 대기중",
  PAID:      "결제완료",
  ORDERED:   "주문완료",
  SHIPPING:  "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "주문취소",
  RETURNED:  "반품",
};

export function formatOrderStatus(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

// 5. 주문 내역 삭제 (DELETE /api/orders/:id)
export async function deleteOrder(orderId: number) {
  const res = await client.delete<ApiResponse<void>>(`/orders/${orderId}`);
  return res.data;
}

