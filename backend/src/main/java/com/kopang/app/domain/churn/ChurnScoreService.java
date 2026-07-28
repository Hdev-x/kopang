package com.kopang.app.domain.churn;

public interface ChurnScoreService {

    // ===== 감지 (룰별: 대상 감지 → 판정 → churn_score 저장) =====

    // 룰1) 장바구니 방치
    void detectCartAbandon();

    // 룰2) 멤버십 해지
    void detectMembershipCancel();

    // 룰3) 첫구매 후 미복귀
    void detectFirstOrderOnly();

    // 룰4) 찜 7일 경과 + 해당 상품 미주문
    void detectWishlistIdle();

    // 룰5) 쿠폰 만료 임박
    void detectCouponExpiring();

    // 룰6) 부정경험(낮은평점 및 취소/반품 경험)
    void detectBadExperience();

    // 룰7) 30일 미로그인
    void detectLoginInactive();

    // 룰8) 최근 30일 지출 < 직전 30일의 50%
    void detectSpendingDrop();

    // 룰 8종 전체 실행 — 수동(/run)과 스케줄러(CHURN-06)가 공유
    void runAllRules();

    // ===== 대응 (intervention) =====

    // 대응 발송 — 오늘자 ④⑧ 대상에 대조군 분리 후 알림 발송 + 전원 기록. 반환 = 실행 결과 요약
    InterventionRunResult runInterventions();

    // 발송 실행 전 대상 현황 조회 (읽기 전용, 대시보드 표시용)
    InterventionPreviewResponse getInterventionPreview();

    // 쿠폰 만료 임박 대응 발송 (CHURN-14)
    void runCouponExpiringInterventions();

    // 미로그인 회원 복귀 유도 대응 발송 (CHURN-16)
    void runLoginInactiveInterventions();

    // ===== 배치 (스케줄러·수동 실행 공유) =====

    /**
     * 일 배치 전체: 감지 → 발송 → 측정 → 지표.
     * 스케줄러와 관리자 수동 실행이 같은 메서드를 쓴다 — "매일 도는 것과 같은 코드"를 보장.
     *
     * @param forceSend 발송 스위치를 무시하고 발송할지.
     *   스케줄러는 false — 스위치가 꺼져 있으면 밤사이 알림·쿠폰이 나가면 안 된다.
     *   관리자 수동 실행은 true — 사람이 대상 수를 확인하고 누르는 것이라
     *   스위치가 꺼져 있어도 실행 의도가 명확하다(시연·운영 개입 모두).
     */
    BatchRunResult runDailyBatch(boolean forceSend);

    // 오늘 실행분 원복 — 대응 이력·알림·발급 쿠폰을 되돌려 다시 실행할 수 있게 한다.
    // 발송 상한(1일 1건·7일 중복)이 걸려 두 번째 실행부터 대상이 0이 되므로,
    // 여러 사람이 시연·테스트하려면 이 경로가 필요하다.
    BatchResetResult resetTodayBatch();

    // ===== 측정·지표 =====

    // 대응 효과 측정 (CHURN-08) — 대응 후 전환 여부를 판정해 intervention_outcome 에 기록.
    // 반환 = 이번 실행에서 확정한 건수 (전환 + 미전환)
    int measureOutcomes();

    // 오늘자 일별 지표(churn_daily_metric) 집계·적재. 배치가 감지·발송 후 호출한다.
    void recordDailyMetric();
}
