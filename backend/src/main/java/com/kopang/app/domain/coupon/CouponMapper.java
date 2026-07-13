package com.kopang.app.domain.coupon;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.Date;
import java.util.List;

@Mapper
public interface CouponMapper {
    // 1. 발급 가능한 전체 쿠폰 리스트 조회 (시작일~종료일이 유효하고 잔여수량 > 0)
    List<CouponDTO> findAvailableCoupons();

    // 2. 회원이 보유한 쿠폰 목록 조회 (조인 포함)
    List<UserCouponDTO> findUserCouponsByUserId(@Param("userId") Long userId);

    // 3. 단건 쿠폰 상세 정보 조회
    CouponDTO findCouponById(@Param("couponId") Long couponId);

    // 4. 특정 이메일/회원의 동일 쿠폰 발급 여부 검사 (중복 다운로드 방지)
    int countUserCouponByCouponId(@Param("userId") Long userId, @Param("couponId") Long couponId);

    // 5. 회원에게 쿠폰 등록 (user_coupons 테이블 추가)
    void insertUserCoupon(UserCouponDTO userCoupon);

    // 6. 마스터 쿠폰 잔여수량 1개 감소
    void decreaseCouponQuantity(@Param("couponId") Long couponId);

    // 7. 결제 완료 시 보유 쿠폰 사용 처리 (used = true 및 used_at 입력)
    void useUserCoupon(@Param("userCouponId") Long userCouponId, @Param("usedAt") Date usedAt);

    // 8. 관리자: 전체 쿠폰 템플릿 목록 조회
    List<CouponDTO> findAllCoupons();

    // 9. 관리자: 신규 쿠폰 템플릿 등록
    void insertCoupon(CouponDTO coupon);
}
