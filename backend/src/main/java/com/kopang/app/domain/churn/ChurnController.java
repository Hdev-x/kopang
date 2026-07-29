package com.kopang.app.domain.churn;

import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

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

    // 대응 발송 수동 실행 — 대시보드 실행 버튼용. 스케줄러 편입 시에도 같은 서비스 메서드 공유
    @PostMapping("/api/admin/churn/intervene")
    // limit: 검증용 소량 발송 (기본 0 = 제한 없음)
    public ResponseEntity<ApiResponse<InterventionRunResult>> runInterventions(
            @RequestParam(defaultValue = "0") int limit) {
        return ResponseEntity.ok(ApiResponse.success(churnScoreService.runInterventions(limit)));
    }

    // 일 배치 수동 실행 — 스케줄러(매일 03:00)와 **같은 메서드**를 호출한다.
    // 감지 → (스위치 on이면) 발송 → 측정 → 지표를 한 번에 수행.
    @PostMapping("/api/admin/churn/batch")
    public ResponseEntity<ApiResponse<BatchRunResult>> runBatch() {
        // forceSend=true — 관리자가 대상 수를 보고 직접 누른 실행이라 스위치와 무관하게 발송한다.
        // (스케줄러는 false를 넘겨 스위치를 따른다)
        return ResponseEntity.ok(ApiResponse.success(churnScoreService.runDailyBatch(true)));
    }

    // 오늘 배치 실행분 원복 — 대응·측정·알림·발급 쿠폰을 되돌려 다시 실행할 수 있게 한다.
    // 발송 상한 때문에 한 번 실행하면 대상이 0이 되므로 시연·테스트 반복에 필요하다.
    @PostMapping("/api/admin/churn/batch/reset")
    public ResponseEntity<ApiResponse<BatchResetResult>> resetBatch() {
        return ResponseEntity.ok(ApiResponse.success(churnScoreService.resetTodayBatch()));
    }

    // 대응 효과 측정 수동 실행 (CHURN-08) — 배치와 같은 서비스 메서드 공유
    @PostMapping("/api/admin/churn/measure")
    public ResponseEntity<ApiResponse<java.util.Map<String, Integer>>> measureOutcomes() {
        int measured = churnScoreService.measureOutcomes();
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of("measured", measured)));
    }

    // 일별 지표 재적재 수동 실행 — 배치와 같은 서비스 메서드 공유.
    // 측정 후에 호출해야 전환·매출이 반영된다(배치도 측정 → 지표 순서).
    @PostMapping("/api/admin/churn/metrics")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> recordMetrics() {
        churnScoreService.recordDailyMetric();
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of("status", "ok")));
    }

    // 발송 실행 전 대상 현황 (읽기 전용) — "오늘 처리할 일" 카운트 표시용
    @GetMapping("/api/admin/churn/intervene/preview")
    public ResponseEntity<ApiResponse<InterventionPreviewResponse>> interventionPreview() {
        return ResponseEntity.ok(ApiResponse.success(churnScoreService.getInterventionPreview()));
    }

    // 쿠폰 만료 임박 대응 수동 실행 (CHURN-14)
    @PostMapping("/api/admin/churn/intervene/coupon-expiring")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> runCouponExpiringInterventions(
            @RequestParam(defaultValue = "0") int limit) {
        churnScoreService.runCouponExpiringInterventions(limit);
        java.util.Map<String, String> data = new java.util.HashMap<>();
        data.put("message", "쿠폰 만료 임박 대응이 성공적으로 실행되었습니다.");
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // 미로그인 회원 복귀 유도 대응 수동 실행 (CHURN-16)
    @PostMapping("/api/admin/churn/intervene/login-inactive")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> runLoginInactiveInterventions(
            @RequestParam(defaultValue = "0") int limit) {
        churnScoreService.runLoginInactiveInterventions(limit);
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
