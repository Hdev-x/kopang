package com.kopang.app.domain.coupon;

import java.util.List;

public interface CouponService {
    // 1. 발급 가능한 마스터 쿠폰 목록 조회
    List<CouponDTO> getAvailableCoupons();

    // 2. 로그인 유저가 보유한 쿠폰 목록 조회
    List<UserCouponDTO> getMyCoupons(String email);

    // 3. 쿠폰 다운로드 (발급 신청)
    UserCouponDTO issueCoupon(String email, Long couponId);

    // 4. 쿠폰 사용 처리 (결제 완료 등)
    void useCoupon(Long userCouponId);
    void useCoupon(Long userCouponId, Long userId);
}
