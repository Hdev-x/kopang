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

    // 대응 발송 — 오늘자 ④⑧ 대상에 대조군 분리 후 알림 발송 + 전원 기록
    void runInterventions();

    // 쿠폰 만료 임박 대응 발송 (CHURN-14)
    void runCouponExpiringInterventions();

    // 미로그인 회원 복귀 유도 대응 발송 (CHURN-16)
    void runLoginInactiveInterventions();
}
