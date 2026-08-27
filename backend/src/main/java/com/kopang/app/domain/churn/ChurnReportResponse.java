package com.kopang.app.domain.churn;

import java.util.List;

import lombok.Data;

/**
 * 대응 효과 리포트 응답 (GET /api/admin/churn/report).
 * intervention_outcome 기반 처치군 vs 대조군 순효과(CHURN-08/10).
 */
@Data
public class ChurnReportResponse {

    private Kpi kpi;                 // 상단 KPI 4지표 (처치군 기준)
    private List<EffectRow> effect; // 액션별 순효과
    private List<TypeEffectRow> typeEffect; // 위험 유형별 순효과
    private List<DailyPoint> dailyTrend;    // 일별 대응·전환 추이
    private List<CouponRoiRow> couponRoi;   // 이탈 대응 쿠폰 ROI

    /** 처치군(is_control=false) 기준 요약 */
    @Data
    public static class Kpi {
        private Integer treated;      // 대응한 위험 고객(처치 건수)
        private Integer conversions;  // 전환(재구매) 건수
        private Long revenue;         // 귀속 매출 합
        private Integer defended;     // 방어한 이탈(잔존) 수
    }

    /** 대응 액션별 순효과 */
    @Data
    public static class EffectRow {
        private String actionType;  // COUPON / PUSH / MODAL / RECOMMEND
        private Double treatPct;    // 처치군 전환율(%)
        private Double controlPct;  // 대조군 전환율(%)
        private Integer conv;       // 처치군 전환 명수
        private Long revenue;       // 귀속 매출 합
        private Integer treatN;     // 처치군 인원 (신뢰도 계산용)
        private Integer controlN;   // 대조군 인원
        private Integer controlConv; // 대조군 전환 명수
    }

    /** 일별 대응(처치)·전환 건수 */
    @Data
    public static class DailyPoint {
        private java.time.LocalDate day;
        private Integer sent;      // 처치군 발송
        private Integer converted; // 그중 전환
    }

    /** 이탈 대응 쿠폰 ROI (비용은 추정 — 정률 쿠폰은 평균 주문액 기준) */
    @Data
    public static class CouponRoiRow {
        private String name;
        private String discountType;  // FIXED / PERCENT
        private Integer discountValue;
        private Integer issued;       // 발급 수
        private Integer used;         // 사용 수
        private Long estimatedCost;   // 추정 발급 비용(사용분)
    }

    /** 위험 유형별 순효과 */
    @Data
    public static class TypeEffectRow {
        private String riskType;    // 위험 유형 (null = ML)
        private Double treatPct;
        private Double controlPct;
        private Integer treated;    // 처치군 대응 수(= treatN)
        private Integer treatConv;
        private Integer controlN;
        private Integer controlConv;
    }
}
