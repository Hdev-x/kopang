package com.kopang.app.domain.churn;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

/**
 * 위험 고객 상세 (GET /api/admin/churn/customers/{userId}).
 * B-2 목록-상세 화면의 상세 절반 — 프로필 + 점수 이력 + 대응 이력 + 주문 요약.
 */
@Data
public class RiskCustomerDetailResponse {

    private Profile profile;
    private List<SignalSummary> signals; // 유형별 요약 (전체 기간)
    private List<ScorePoint> scoreHistory; // 최근순
    private List<InterventionItem> interventions; // 최근순
    private OrderSummary orderSummary;

    /** 위험 신호 유형별 요약 — 첫/마지막 감지일·횟수·최신 점수 + 마지막 대응 */
    @Data
    public static class SignalSummary {
        private String riskType; // null = ML 예측 (유형 없음)
        private String source; // 최신 기록의 RULE / ML
        private Double latestScore;
        private String latestLevel;
        private LocalDateTime firstDetectedAt;
        private LocalDateTime lastDetectedAt;
        private Long detectCount;
        private LocalDateTime lastInterventionAt; // null = 대응 없음
        private String lastOutcome; // CONTROL / CONVERTED / NO_RESPONSE / null
    }

    @Data
    public static class Profile {
        private Long userId;
        private String name;
        private String email;
        private Boolean isMember; // 멤버십(ACTIVE) 여부
        private LocalDate joinedAt; // users.created_at
        private LocalDateTime lastLoginAt;
    }

    @Data
    public static class ScorePoint {
        private LocalDateTime scoredAt;
        private Double score;
        private String riskLevel; // HIGH / MID / LOW
        private String riskType;
        private String source; // RULE / ML
    }

    @Data
    public static class InterventionItem {
        private LocalDateTime createdAt;
        private String riskType;
        private String actionType; // COUPON / PUSH / MODAL ...
        private String channel;
        private Boolean isControl;
        private String outcome; // CONTROL / CONVERTED / NO_RESPONSE (대응이력 화면과 같은 기준)
    }

    @Data
    public static class OrderSummary {
        private Long orderCount; // 결제 완료 주문 수
        private Long totalSpent; // 누적 결제액
        private Long avgAmount; // 평균 주문액
        private LocalDateTime lastOrderedAt;
    }
}
