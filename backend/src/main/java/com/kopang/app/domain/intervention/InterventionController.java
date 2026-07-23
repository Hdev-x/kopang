package com.kopang.app.domain.intervention;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class InterventionController {

    private final InterventionQueryService interventionQueryService;

    // 대응 이력 조회 (CHURN-11). type=위험 유형 필터(옵션). /api/admin/** 는 ADMIN만 통과.
    @GetMapping("/api/admin/interventions")
    public ResponseEntity<ApiResponse<List<InterventionLogResponse>>> getLogs(
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(ApiResponse.success(interventionQueryService.getLogs(type)));
    }
}
