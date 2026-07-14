package com.kopang.app.domain.admin;

import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface AdminMapper {
    // 1. 회원 전체 리스트와 이탈 위험 정보 조회
    List<AdminMemberDTO> findAllMembers();

    // 2. 전체 활성 멤버십 회원수 집계
    int countMemberships();

    // 3. 이번달 신규 멤버십 회원수 집계
    int countNewMembershipsThisMonth();

    // 4. 이탈 위험(HIGH) 단계의 멤버십 회원수 집계
    int countAtRiskMemberships();

    // 5. 해지 위험도가 높은 멤버십 회원 상세 리스트 조회
    List<AdminMembershipStatsDTO.AtRiskMemberDTO> findAtRiskMembers();

    // 6. 쿠폰 발급/사용 실적 집계 목록 조회
    List<AdminCouponStatsDTO> findCouponStats();

    // 7. 신규 쿠폰 정책 추가 (이벤트 생성)
    void insertCouponPolicy(com.kopang.app.domain.coupon.CouponDTO coupon);
}
