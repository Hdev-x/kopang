package com.kopang.app.domain.notification;

import java.time.LocalDateTime;
import java.util.List;

// API 응답 전용 형태 (docs/API_명세서.md 7. 알림)
// res: { "items": [ { "id", "type", "message", "refId", "read", "createdAt" } ] }
public record NotificationListResponse(List<Item> items) {

    public record Item(
            Long id,
            String type,
            String message,
            Long refId,          // 클릭 이동 대상(상품·쿠폰 id), nullable
            boolean read,
            LocalDateTime createdAt) {
    }

    // DB 조회 결과(NotificationDTO)를 명세서 응답 형태로 변환
    public static NotificationListResponse from(List<NotificationDTO> list) {
        List<Item> items = list.stream()
                .map(n -> new Item(
                        n.getNotificationId(),
                        n.getType(),
                        n.getMessage(),
                        n.getRefId(),
                        Boolean.TRUE.equals(n.getIsRead()),
                        n.getCreatedAt()))
                .toList();
        return new NotificationListResponse(items);
    }
}
