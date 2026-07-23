package com.kopang.app.domain.churn;

/** 찜 상품 가격인하 알림 서비스 (CHURN-13) */
public interface WishlistAlertService {

    /**
     * 찜한 상품이 할인 중인 회원에게 WISHLIST 알림 발송.
     * @param limit 발송 상한 (검증 시 소량)
     * @return 실제 발송 건수
     */
    int sendDiscountAlerts(int limit);
}
