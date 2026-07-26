package com.kopang.app.domain.churn;

/** 발송 실행 전 대상 현황 — 관리자 대시보드 "오늘 처리할 일" 표시용 (읽기 전용) */
public record InterventionPreviewResponse(
        int integratedCount, // 통합 발송 대상 (FIRST_ORDER_ONLY, 7일 중복 제외 반영)
        int couponExpiringCount, // 쿠폰 만료 임박 (CHURN-14)
        int loginInactiveCount) { // 미로그인 복귀 유도 (CHURN-16)
}
