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
    }
}
