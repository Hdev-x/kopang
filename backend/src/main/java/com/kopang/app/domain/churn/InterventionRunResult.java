package com.kopang.app.domain.churn;

/** 통합 대응 발송 실행 결과 요약 — 관리자 대시보드 실행 버튼 응답용 */
public record InterventionRunResult(
        int targetCount, // 오늘 발송 후보 전원
        int sentCount, // 처치군(실제 발송)
        int controlCount) { // 대조군 + 정책 제외(상한·배타)로 발송하지 않은 수
}
