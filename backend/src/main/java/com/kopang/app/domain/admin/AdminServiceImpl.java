package com.kopang.app.domain.admin;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private final AdminMapper adminMapper;

    public AdminServiceImpl(AdminMapper adminMapper) {
        this.adminMapper = adminMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminMemberDTO> getMemberList() {
        return adminMapper.findAllMembers();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminMembershipStatsDTO getMembershipStats() {
        int total = adminMapper.countMemberships();
        int newSubscribers = adminMapper.countNewMembershipsThisMonth();
        int atRisk = adminMapper.countAtRiskMemberships();

        // 유지율 산출 = ((전체 회원 - 해지 위험군) / 전체 회원) * 100
        double retentionRate = 100.0;
        if (total > 0) {
            retentionRate = ((double) (total - atRisk) / total) * 100.0;
            retentionRate = Math.round(retentionRate * 10.0) / 10.0; // 소수점 한자리 반올림
        }

        List<AdminMembershipStatsDTO.AtRiskMemberDTO> atRiskList = adminMapper.findAtRiskMembers();

        return AdminMembershipStatsDTO.builder()
                .membershipCount(total)
                .newSubscribersThisMonth(newSubscribers)
                .atRiskCount(atRisk)
                .retentionRate(retentionRate)
                .atRiskMembers(atRiskList)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminCouponStatsDTO> getCouponStats() {
        return adminMapper.findCouponStats();
    }

    @Override
    public void createCoupon(com.kopang.app.domain.coupon.CouponDTO coupon) {
        if (coupon.getName() == null || coupon.getName().isEmpty()) {
            throw new IllegalArgumentException("쿠폰 이름을 입력해 주세요");
        }
        if (coupon.getDiscountValue() <= 0) {
            throw new IllegalArgumentException("할인 수치는 0보다 커야 합니다");
        }
        if (coupon.getStartDate() == null) {
            coupon.setStartDate(new java.util.Date()); // 기본 오늘
        }
        if (coupon.getEndDate() == null) {
            // 기본 30일 뒤 만료 설정
            java.util.Calendar cal = java.util.Calendar.getInstance();
            cal.setTime(coupon.getStartDate());
            cal.add(java.util.Calendar.DAY_OF_MONTH, 30);
            coupon.setEndDate(cal.getTime());
        }
        if (coupon.getQuantity() <= 0) {
            coupon.setQuantity(10000); // 기본 대량
        }

        adminMapper.insertCouponPolicy(coupon);
    }
}
