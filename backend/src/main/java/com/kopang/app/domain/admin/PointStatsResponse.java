package com.kopang.app.domain.admin;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 관리자 포인트 관리 화면 응답.
 *
 * 멤버십/일반 비교가 핵심이다. 구매확정 적립률이 일반 1% · 멤버십 5%로 갈리므로
 * (OrderService.confirmPurchase) 두 집단의 적립 규모를 나란히 보여준다.
 */
@Getter
@Setter
public class PointStatsResponse {

    /** 전체 합계 */
    private Long totalEarned;
    private Long totalUsed;
    private Long totalBalance;
    private Long earnCount;

    /** 등급별 비교 (멤버십 / 일반) */
    private List<TierStat> tiers;

    /** 최근 적립·사용 내역 */
    private List<PointLog> recentLogs;

    @Getter
    @Setter
    public static class TierStat {
        /** MEMBERSHIP / GENERAL */
        private String tier;
        /** 해당 등급에서 포인트 이력이 있는 회원 수 */
        private Long memberCount;
        /** 구매확정 적립 건수 */
        private Long earnCount;
        /** 구매확정 적립 합계 */
        private Long earnedAmount;
        /** 건당 평균 적립 */
        private Long averageEarned;
        /** 적립률(%) — 정책값. 1 또는 5 */
        private Integer ratePercent;
    }

    @Getter
    @Setter
    public static class PointLog {
        private Long pointId;
        private Long userId;
        private String userName;
        /** MEMBERSHIP / GENERAL */
        private String tier;
        private Integer amount;
        private String type;
        private String description;
        private String createdAt;
    }
}
