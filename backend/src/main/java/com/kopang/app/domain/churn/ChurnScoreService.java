package com.kopang.app.domain.churn;

public interface ChurnScoreService {

    // 각 룰: 대상 감지 → 판정 → churn_score 저장

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

    // 룰7) 30일 미로그인
    void detectLoginInactive();

    // 룰8) 최근 30일 지출 < 직전 30일의 50%
    void detectSpendingDrop();
    

}
