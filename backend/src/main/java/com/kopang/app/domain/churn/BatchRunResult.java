package com.kopang.app.domain.churn;

/**
 * 일 배치 실행 결과 — 관리자 화면이 "무엇이 얼마나 처리됐는지" 보여주기 위한 요약.
 *
 * @param detected           감지된 위험 판정 수 (룰 8종)
 * @param mlScored           ML 스코어링 수 (서빙 불가 시 0)
 * @param interventionOn     자동 발송 스위치 상태 — false면 감지·측정·지표만 수행
 * @param sent               발송 건수 (처치군)
 * @param control            대조군 건수 (기록만, 발송 안 함)
 * @param measured           이번 실행에서 전환 판정이 확정된 건수
 */
public record BatchRunResult(
        int detected,
        int mlScored,
        boolean interventionOn,
        int sent,
        int control,
        int measured) {
}
