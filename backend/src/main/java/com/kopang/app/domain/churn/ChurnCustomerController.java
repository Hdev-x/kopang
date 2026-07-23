package com.kopang.app.domain.churn;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ChurnCustomerController {

    private final ChurnCustomerService churnCustomerService;

    // 위험 고객 목록 (FR-ADMIN-08). memberType/level 필터 옵션. /api/admin/** 는 ADMIN만 통과.
    @GetMapping("/api/admin/churn/customers")
    public ResponseEntity<ApiResponse<RiskCustomerListResponse>> customers(
            @RequestParam(name = "memberType", required = false) String memberType,
            @RequestParam(name = "level", required = false) String level,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size) {
        return ResponseEntity.ok(
                ApiResponse.success(churnCustomerService.getRiskCustomers(memberType, level, page, size)));
    }
}
