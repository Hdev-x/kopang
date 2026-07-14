package com.kopang.app.domain.admin;

import java.util.List;

public interface AdminService {
    // 1. 회원 목록 조회
    List<AdminMemberDTO> getMemberList();

    // 2. 멤버십 KPI 대시보드 조회
    AdminMembershipStatsDTO getMembershipStats();

    // 3. 쿠폰 관리 현황 통계 조회
    List<AdminCouponStatsDTO> getCouponStats();

    // 4. 신규 쿠폰 발행 (이벤트 등록)
    void createCoupon(com.kopang.app.domain.coupon.CouponDTO coupon);
}
