package com.kopang.app.domain.membership;

public interface MembershipService {
    // 1. 회원의 현재 WOW 멤버십 상태 조회
    public UserMembershipDTO getActiveMembership(String email);

    // 2. WOW 멤버십 가입
    public UserMembershipDTO subscribe(String email);

    // 3. WOW 멤버십 해지 예약
    public void cancel(String email);

    // 4. WOW 멤버십 해지 철회 (유지)
    public void keep(String email);

    // 5. 회원이 최근 30일 이내에 아낀 배송비 연산 (주문완료 건수 * 3000원)
    public int getSavedShippingFee(String email);
}
