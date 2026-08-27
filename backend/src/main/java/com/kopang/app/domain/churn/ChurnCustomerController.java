package com.kopang.app.domain.churn;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ChurnCustomerController {

    private final ChurnCustomerService churnCustomerService;

    // 위험 고객 목록 (FR-ADMIN-08). type/memberType/level 필터 옵션.
    @GetMapping("/api/admin/churn/customers")
    public ResponseEntity<ApiResponse<RiskCustomerListResponse>> customers(
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "memberType", required = false) String memberType,
            @RequestParam(name = "level", required = false) String level,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size) {
        return ResponseEntity.ok(
                ApiResponse.success(churnCustomerService.getRiskCustomers(type, memberType, level, page, size)));
    }

    // 위험 고객 상세 (B-2) — 프로필 + 점수 이력 + 대응 이력 + 주문 요약
    @GetMapping("/api/admin/churn/customers/{userId}")
    public ResponseEntity<ApiResponse<RiskCustomerDetailResponse>> customerDetail(
            @PathVariable(name = "userId") long userId) {
        RiskCustomerDetailResponse detail = churnCustomerService.getRiskCustomerDetail(userId);
        if (detail == null) {
            return ResponseEntity.status(404).body(ApiResponse.fail("존재하지 않는 회원입니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(detail));
    }
}
