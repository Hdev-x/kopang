import { client } from "./client";
import type { ApiResponse } from "../types/api";

// 서버 알림 1건 (GET /api/notifications 응답의 items 원소)
// type = NotificationDTO의 type enum (ABANDON / REBUY / WISHLIST / ...)
export type NotificationItem = {
  id: number;
  type: string;
  message: string;
  refId: number | null; // 클릭 이동 대상(상품·쿠폰 id), 없으면 null
  read: boolean;
  createdAt: string; // ISO 문자열
};

// 내 알림 목록 (GET /api/notifications) — 최신순
export async function getNotifications() {
  const res = await client.get<ApiResponse<{ items: NotificationItem[] }>>("/notifications");
  return res.data.data.items;
}
