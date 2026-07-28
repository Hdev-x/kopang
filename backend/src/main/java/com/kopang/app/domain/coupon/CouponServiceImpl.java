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

        // 만료일 검사 (오늘 날짜와 비교)
        Date today = new Date();
        if (coupon.getEndDate() != null && coupon.getEndDate().before(today)) {
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

        // 수량 1개 감소
        couponMapper.decreaseCouponQuantity(couponId);

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
        List<UserCouponDTO> list = couponMapper.findUserCouponsByUserId(user.getUserId());
        return list.stream()
                .filter(uc -> uc.getCouponId().equals(couponId))
                .findFirst()
                .orElse(userCoupon);
    }

    @Override
    public void useCoupon(Long userCouponId) {
        if (userCouponId == null) {
            return;
        }
        UserCouponDTO userCoupon = couponMapper.findUserCouponById(userCouponId);
        if (userCoupon == null) {
            throw new IllegalArgumentException("존재하지 않는 쿠폰입니다");
        }
        if (userCoupon.isUsed()) {
            throw new IllegalStateException("이미 사용 처리된 쿠폰입니다");
        }
        Date today = new Date();
        if (userCoupon.getExpiresAt() != null && userCoupon.getExpiresAt().before(today)) {
            throw new IllegalArgumentException("유효기간이 만료된 쿠폰입니다");
        }
        couponMapper.useUserCoupon(userCouponId, today);
    }
}

