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
public class RepurchaseController {

    private final RepurchaseService repurchaseService;

    // 재구매 알림 발송 (CHURN-04). limit 필수 — 실수로 전체 발송 방지. 추후 스케줄러 편입.
    // /api/admin/** 는 Security에서 ADMIN만 통과.
    @PostMapping("/api/admin/churn/repurchase")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> sendRepurchase(
            @RequestParam int limit) {
        int sent = repurchaseService.sendRepurchaseAlerts(limit);
        return ResponseEntity.ok(ApiResponse.success(Map.of("sent", sent)));
    }
}
