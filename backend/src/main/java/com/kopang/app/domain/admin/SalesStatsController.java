package com.kopang.app.domain.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class SalesStatsController {

    private final SalesStatsService salesStatsService;

    // 매출 통계 (FR-ADMIN-01). 기존 AdminController와 분리. /api/admin/** 는 ADMIN만 통과.
    @GetMapping("/api/admin/stats/sales")
    public ResponseEntity<ApiResponse<SalesStatsResponse>> salesStats() {
        return ResponseEntity.ok(ApiResponse.success(salesStatsService.getSalesStats()));
    }
}
