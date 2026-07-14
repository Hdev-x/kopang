package com.kopang.app.domain.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMembershipStatsDTO {
    private int membershipCount;
    private int newSubscribersThisMonth;
    private int atRiskCount;
    private double retentionRate;
    private List<AtRiskMemberDTO> atRiskMembers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AtRiskMemberDTO {
        private String name;
        private Date ends;
        private double score;
        private String reason;
        private String action; // 만류 쿠폰, 갱신 할인 등
        private String status; // 예정, 발송됨 등
    }
}
