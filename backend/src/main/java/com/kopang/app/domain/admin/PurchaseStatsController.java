package com.kopang.app.domain.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/stats/purchases")
@RequiredArgsConstructor
public class PurchaseStatsController {

    private final PurchaseStatsService purchaseStatsService;

    @GetMapping
    public ResponseEntity<ApiResponse<PurchaseStatsResponse>> stats() {
        return ResponseEntity.ok(
                ApiResponse.success(purchaseStatsService.getStats()));
    }
}
