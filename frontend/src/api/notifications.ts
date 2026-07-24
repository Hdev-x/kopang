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

export async function getNotifications() {
  const res = await client.get<ApiResponse<{ items: NotificationItem[] }>>("/notifications");
  return res.data.data.items;
}

// 알림 읽음 처리 (PATCH /api/notifications/{id}/read) — 본인 알림만
export async function markNotificationRead(id: number) {
  await client.patch(`/notifications/${id}/read`);
}

// 알림 클릭 처리 (PATCH /api/notifications/{id}/click) — 본인 알림만
export async function markNotificationClicked(id: number) {
  await client.patch(`/notifications/${id}/click`);
}
