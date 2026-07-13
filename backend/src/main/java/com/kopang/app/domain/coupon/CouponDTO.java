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
public class CouponDTO {
    private Long couponId;
    private String name;
    private String discountType; // RATE (비율) / AMOUNT (금액)
    private int discountValue; // 할인 수치 (10%면 10, 3000원이면 3000)
    private Date startDate;
    private Date endDate;
    private int quantity; // 선착순 잔여 수량
}
