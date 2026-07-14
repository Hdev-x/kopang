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
public class AdminMemberDTO {
    private Long userId;
    private String name;
    private String email;
    private String role;
    private Date createdAt;
    private String membershipType; // 멤버십 / 일반
    private String riskLevel; // 고위험 / 중위험 / 저위험
    private Double churnProbability; // 이탈 점수 (0~1)
}
