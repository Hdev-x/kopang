package com.kopang.app.domain.membership;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.Date;
import java.util.List;

@Mapper
public interface MembershipMapper {
    // 1. 회원의 활성화된 WOW 멤버십 정보 조회 (ACTIVE 또는 CANCELLED 상태)
    public UserMembershipDTO findActiveMembershipByUserId(@Param("userId") Long userId);

    // 2. 멤버십 가입 등록
    public void insertUserMembership(UserMembershipDTO userMembership);

    // 3. 멤버십 해지 예약 처리 (status를 CANCELLED로 변경하고 cancelled_at 기입)
    public void cancelUserMembership(@Param("userMembershipId") Long userMembershipId, @Param("cancelledAt") Date cancelledAt);

    // 4. 멤버십 해지 철회 및 ACTIVE 유지 처리 (status를 ACTIVE로 변경하고 cancelled_at을 NULL로 초기화)
    public void reactivateUserMembership(@Param("userMembershipId") Long userMembershipId);

    // 5. 최근 30일 이내에 해당 회원이 완료(PAID, SHIPPING, DELIVERED)한 주문 건수 집계
    public int countPaidOrdersLast30Days(@Param("userId") Long userId);

    // 6. 관리자: 전체 활성 멤버십 회원 수 조회
    public int countTotalMembers();

    // 7. 관리자: 이번 달 신규 멤버십 회원 수 조회
    public int countNewMembersThisMonth();

    // 8. 관리자: 해지 예약(CANCELLED) 상태인 회원 수 조회
    public int countCancelledMembers();

    // 9. 관리자: 해지 예약 상태 회원 리스트 조회
    public List<UserMembershipDTO> findCancelledMemberships();
}
