package com.kopang.app.domain.churn;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ChurnMapper {
    
    // ===== 조회 =====

    // 룰2) 멤버십 해지
    List<Long> findMembershipCancelUsers();

    // 룰3) 첫구매 후 미복귀 회원 목록
    List<Long> findFirstOrderOnlyUsers();

    // 룰5) 쿠폰 만료 임박 회원 목록
    List<Long> findCouponExpiringUsers();

    // 룰7) 30일 미로그인 회원 목록
    List<Long> findLoginInactiveUsers();


    // ===== 저장 =====

    // 이탈 점수 저장 (모든 룰 공통)
    void insertChurnScore(ChurnScoreDTO score);

}
