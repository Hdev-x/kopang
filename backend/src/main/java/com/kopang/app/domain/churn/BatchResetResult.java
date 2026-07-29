package com.kopang.app.domain.churn;

/**
 * 오늘 배치 실행분 원복 결과.
 *
 * 왜 필요한가: 발송 상한(유저당 1일 1건 · 유형별 7일 중복 방지)이 걸려 있어
 * 한 번 발송하면 그날 대상이 사라진다. 여러 사람이 시연·테스트하려면 되돌려야 한다.
 *
 * @param interventions 삭제한 대응 이력
 * @param outcomes      삭제한 측정 결과
 * @param notifications 삭제한 알림
 * @param coupons       회수한 발급 쿠폰 (재고도 함께 복구)
 */
public record BatchResetResult(
        int interventions,
        int outcomes,
        int notifications,
        int coupons) {
}
