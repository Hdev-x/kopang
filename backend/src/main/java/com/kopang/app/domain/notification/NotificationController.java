package com.kopang.app.domain.notification;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 1. 회원별 전체 알림 목록 조회 (GET /api/notifications)
    @GetMapping
    public ResponseEntity<ApiResponse<NotificationListResponse>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            List<NotificationDTO> list = notificationService.getNotifications(userDetails.getEmail());
            return ResponseEntity.ok(ApiResponse.success(NotificationListResponse.from(list)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 2. 미독 알림 개수 조회 (GET /api/notifications/unread-count)
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            int count = notificationService.getUnreadCount(userDetails.getEmail());
            Map<String, Integer> data = new HashMap<>();
            data.put("count", count);
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 3. 알림 읽음 처리 (PATCH /api/notifications/{id}/read)
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Map<String, String>>> readNotification(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long id) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            notificationService.readNotification(userDetails.getEmail(), id);
            Map<String, String> data = new HashMap<>();
            data.put("message", "알림을 읽음 처리했습니다.");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 4. 알림 클릭 처리 (PATCH /api/notifications/{id}/click)
    @PatchMapping("/{id}/click")
    public ResponseEntity<ApiResponse<Map<String, String>>> clickNotification(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long id) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            notificationService.clickNotification(userDetails.getEmail(), id);
            Map<String, String> data = new HashMap<>();
            data.put("message", "알림을 클릭 처리했습니다.");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
