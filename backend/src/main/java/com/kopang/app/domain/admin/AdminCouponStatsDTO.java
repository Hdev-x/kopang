package com.kopang.app.domain.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCouponStatsDTO {
    private Long couponId;
    private String name;
    private String discountType;
    private int discountValue;
    private Date endDate;
    private int quantity;
    private int issuedCount;
    private int usedCount;
    private String targetGroup; // 위험고객 / 멤버십 해지위험 / 주기단절 / 신규 등
}
