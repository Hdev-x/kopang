package com.kopang.app.domain.coupon;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCouponDTO {
    private Long userCouponId;
    private Long userId;
    private Long couponId;
    private boolean used;
    private Date issuedAt;
    private Date expiresAt;
    private Date usedAt;

    // 조인 정보 추가 (프론트엔드 연동용)
    private String name; // 쿠폰명
    private String discountType; // 할인방식 (RATE / AMOUNT)
    private int discountValue; // 할인값
}
