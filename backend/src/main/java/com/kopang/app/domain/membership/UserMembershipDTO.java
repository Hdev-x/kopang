package com.kopang.app.domain.membership;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserMembershipDTO {
    private Long userMembershipId;
    private Long userId;
    private Long membershipId;
    private Date startDate;
    private Date endDate;
    private String status; // ACTIVE / EXPIRED / CANCELLED
    private Date cancelledAt;

    // 조인 정보 추가 (프론트엔드 연동용)
    private String name; // 멤버십 이름
    private int price; // 멤버십 가격
    private int discountRate; // 멤버십 할인율
    private String description; // 멤버십 설명
}
