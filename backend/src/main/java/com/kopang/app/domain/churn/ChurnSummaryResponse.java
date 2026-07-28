package com.kopang.app.domain.churn;

import java.time.LocalDate;
import java.util.List;

import lombok.Data;

/**
 * 이탈 대시보드 집계 응답 (GET /api/admin/churn/summary).
 * 화면 5개 섹션(KPI·위험도 분포·유형 세그먼트·주간 추이·대응 효과·위험 고객)을 한 번에 담는다.
 * 각 섹션은 별도 집계 쿼리 결과이며 Service에서 조립한다.
 */
@Data
public class ChurnSummaryResponse {

    private Kpi kpi;                        // 상단 KPI 4지표 (최신 일별 스냅샷)
    private List<LevelCount> levelCounts;  // ① 위험도 분포 (HIGH/MID/LOW)
    private List<TypeCount> typeCounts;    // ①-c 위험 유형별 인원 (현재 상태 기준 — 임시, 팀 확정 전)
    private List<SegmentCount> segments;   // ①-b 일반/멤버십 세그먼트별 고위험
    private List<TrendPoint> weeklyChurnRate; // ② 주간 이탈율 추이
    private List<EffectRow> effect;        // ③ 대응 효과 (처치군 vs 대조군)
    private List<AtRiskCustomer> atRisk;   // ④ 위험 고객 상위
    private java.time.LocalDateTime lastRuleRunAt; // 마지막 감지 배치(RULE) 실행 시각
    private OpsSummary ops;                // ⑤ 대응 운영 현황 (C-2)
    private MlCover mlCover;               // ⑥ 룰 vs ML 감지 커버 (C-2)

    /** KPI — churn_daily_metric 최신 1행에서 산출 */
    @Data
    public static class Kpi {
        private Integer highRiskCount;     // 고위험 고객 수
        private Double churnRate;          // 주간 이탈율(%)
        private Double conversionRate;     // 대응 전환율(%) = 전환/대응
        private Long attributedRevenue;    // 대응 귀속 매출
    }

    /** 위험 등급별 인원 */
    @Data
    public static class LevelCount {
        private String riskLevel;          // HIGH / MID / LOW
        private Integer count;
    }

    /** 대응 운영 현황 — retention_intervention 기준 */
    @Data
    public static class OpsSummary {
        private Integer sentToday;        // 오늘 실제 발송(처치군)
        private Integer sentPushToday;    // 오늘 발송 중 PUSH
        // 오늘 실제 발급된 쿠폰 수. action_type='COUPON' 을 세지 않는 이유:
        // 대응은 전부 action_type='PUSH' 로 기록되고(발송 채널), 쿠폰은 autoIssueCoupon()
        // 으로 따로 발급된다. 채널로 세면 쿠폰이 나가도 항상 0이 된다.
        private Integer sentCouponToday;
        private Integer controlToday;     // 오늘 대조군
        private Long totalCount;          // 누적 대응 기록
        private Long convertedCount;      // 전환(처치군, 7일 귀속)
        private Integer highTotal;        // 고위험(현재 상태) 수
        private Integer highCovered;      // 그중 대응 기록 있는 수 → 커버리지
    }

    /** 룰 vs ML 감지 커버 — 룰(최근 7일) / ML(최근 30일) 대상자 교차 */
    @Data
    public static class MlCover {
        private Integer ruleOnly;
        private Integer mlOnly;
        private Integer both;
        private Long blindspotSent;              // ML 사각지대 전용 발송 누적
        private java.time.LocalDateTime lastMlRunAt; // 마지막 ML 예측 실행
    }

    /** 위험 유형별 인원 — riskType null = ML 예측 */
    @Data
    public static class TypeCount {
        private String riskType;
        private Integer count;
    }

    /** 일반/멤버십 세그먼트별 고위험 */
    @Data
    public static class SegmentCount {
        private String segment;            // MEMBER / NORMAL
        private Integer total;
        private Integer high;
    }

    /** 주간 이탈율 추이 1점 */
    @Data
    public static class TrendPoint {
        private LocalDate metricDate;
        private Double churnRate;
    }

    /** 대응 액션별 순효과 (처치군 vs 대조군 전환율) */
    @Data
    public static class EffectRow {
        private String actionType;         // COUPON / PUSH / MODAL / RECOMMEND
        private Double treatPct;           // 처치군 전환율(%)
        private Double controlPct;         // 대조군 전환율(%)
        private Long revenue;              // 귀속 매출 합
    }

    /** 위험 고객 목록 1행 */
    @Data
    public static class AtRiskCustomer {
        private Long userId;
        private String name;
        private Double score;
        private String riskLevel;
        private String riskType;
        private Boolean isMember;
    }
}
