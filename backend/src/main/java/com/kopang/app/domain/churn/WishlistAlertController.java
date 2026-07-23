package com.kopang.app.domain.churn;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class WishlistAlertController {

    private final WishlistAlertService wishlistAlertService;

    // 찜 상품 가격인하 알림 발송 (CHURN-13). limit 필수 — 전체 발송 실수 방지. 추후 스케줄러 편입.
    // /api/admin/** 는 Security에서 ADMIN만 통과.
    @PostMapping("/api/admin/churn/wishlist-alert")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> sendWishlistAlert(
            @RequestParam int limit) {
        int sent = wishlistAlertService.sendDiscountAlerts(limit);
        return ResponseEntity.ok(ApiResponse.success(Map.of("sent", sent)));
    }
}
