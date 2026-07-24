package com.kopang.app.domain.churn;

import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequiredArgsConstructor
public class ChurnController {

    private final ChurnScoreService churnScoreService;
    private final ChurnDashboardService churnDashboardService;

    // [임시] 이탈 판정 배치 수동 실행 — 추후 스케줄러(CHURN-06)로 대체
    @PostMapping("/api/admin/churn/run")
    public void run() {
        churnScoreService.runAllRules();
    }

    // [임시] 대응 자동 발송 수동 실행 — 검증 후 06 스케줄러에 편입
    @PostMapping("/api/admin/churn/intervene")
    public void runInterventions() {
        churnScoreService.runInterventions();
    }

    // 쿠폰 만료 임박 대응 수동 실행 (CHURN-14)
    @PostMapping("/api/admin/churn/intervene/coupon-expiring")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> runCouponExpiringInterventions() {
        churnScoreService.runCouponExpiringInterventions();
        java.util.Map<String, String> data = new java.util.HashMap<>();
        data.put("message", "쿠폰 만료 임박 대응이 성공적으로 실행되었습니다.");
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // 미로그인 회원 복귀 유도 대응 수동 실행 (CHURN-16)
    @PostMapping("/api/admin/churn/intervene/login-inactive")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> runLoginInactiveInterventions() {
        churnScoreService.runLoginInactiveInterventions();
        java.util.Map<String, String> data = new java.util.HashMap<>();
        data.put("message", "미로그인 회원 복귀 유도 대응이 성공적으로 실행되었습니다.");
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // 이탈 대시보드 집계 (CHURN-09). /api/admin/** 는 Security에서 ADMIN만 통과.
    @GetMapping("/api/admin/churn/summary")
    public ResponseEntity<ApiResponse<ChurnSummaryResponse>> summary() {
        return ResponseEntity.ok(ApiResponse.success(churnDashboardService.getSummary()));
    }

}
