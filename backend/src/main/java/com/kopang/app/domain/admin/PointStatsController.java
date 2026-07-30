package com.kopang.app.domain.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/points")
@RequiredArgsConstructor
public class PointStatsController {

    private final PointStatsService pointStatsService;

    @GetMapping
    public ResponseEntity<ApiResponse<PointStatsResponse>> stats() {
        return ResponseEntity.ok(
                ApiResponse.success(pointStatsService.getStats()));
    }
}
