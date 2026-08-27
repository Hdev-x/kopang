package com.kopang.app.domain.coupon;

import com.kopang.app.domain.user.UserDTO;
import com.kopang.app.domain.user.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;
import java.util.List;

@Service
@Transactional
public class CouponServiceImpl implements CouponService {

    private final CouponMapper couponMapper;
    private final UserMapper userMapper;

    public CouponServiceImpl(CouponMapper couponMapper, UserMapper userMapper) {
        this.couponMapper = couponMapper;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponDTO> getAvailableCoupons() {
        return couponMapper.findAvailableCoupons();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserCouponDTO> getMyCoupons(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }
        return couponMapper.findUserCouponsByUserId(user.getUserId());
    }

    @Override
    public UserCouponDTO issueCoupon(String email, Long couponId) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }

        CouponDTO coupon = couponMapper.findCouponById(couponId);
        if (coupon == null) {
            throw new IllegalArgumentException("존재하지 않는 쿠폰입니다");
        }

        // 만료일 검사 (오늘 날짜 시작점과 비교)
        Date today = new Date();
        Date todayStart = getStartOfToday();
        if (coupon.getEndDate() != null && coupon.getEndDate().before(todayStart)) {
            throw new IllegalArgumentException("유효기간이 만료된 쿠폰입니다");
        }

        // 선착순 잔여 수량 검사
        if (coupon.getQuantity() <= 0) {
            throw new IllegalArgumentException("선착순 쿠폰 수량이 모두 소진되었습니다");
        }

        // 중복 발급 검사 (이미 보유 중인 쿠폰인지)
        int existingCount = couponMapper.countUserCouponByCouponId(user.getUserId(), couponId);
        if (existingCount > 0) {
            throw new IllegalStateException("이미 다운로드 받은 쿠폰입니다");
        }

        // 수량 1개 감소 (영향받은 행 수가 0이면 선착순 동시성 소진)
        int updatedRows = couponMapper.decreaseCouponQuantity(couponId);
        if (updatedRows == 0) {
            throw new IllegalStateException("선착순 쿠폰 수량이 모두 소진되었습니다");
        }

        // 쿠폰 발급 등록
        UserCouponDTO userCoupon = UserCouponDTO.builder()
                .userId(user.getUserId())
                .couponId(couponId)
                .used(false)
                .issuedAt(today)
                .expiresAt(coupon.getEndDate())
                .usedAt(null)
                .build();

        couponMapper.insertUserCoupon(userCoupon);

        // 발급한 쿠폰 상세를 조인해서 리턴하기 위해 조회
        UserCouponDTO created = couponMapper.findUserCouponById(userCoupon.getUserCouponId());
        return created != null ? created : userCoupon;
    }

    @Override
    public void useCoupon(Long userCouponId) {
        useCoupon(userCouponId, null);
    }

    @Override
    public void useCoupon(Long userCouponId, Long userId) {
        if (userCouponId == null) {
            return;
        }
        UserCouponDTO userCoupon = couponMapper.findUserCouponById(userCouponId);
        if (userCoupon == null) {
            throw new IllegalArgumentException("존재하지 않는 쿠폰입니다");
        }
        if (userId != null && !userCoupon.getUserId().equals(userId)) {
            throw new IllegalArgumentException("해당 쿠폰에 대한 접근 권한이 없습니다");
        }
        if (userCoupon.isUsed()) {
            throw new IllegalStateException("이미 사용 처리된 쿠폰입니다");
        }
        Date today = new Date();
        Date todayStart = getStartOfToday();
        if (userCoupon.getExpiresAt() != null && userCoupon.getExpiresAt().before(todayStart)) {
            throw new IllegalArgumentException("유효기간이 만료된 쿠폰입니다");
        }
        couponMapper.useUserCoupon(userCouponId, today);
    }

    private Date getStartOfToday() {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        return cal.getTime();
    }
}

