package com.kopang.app.domain.churn;

/** 이탈 대시보드 집계 조회 서비스 */
public interface ChurnDashboardService {

    /** 대시보드 요약 집계 (KPI·분포·세그먼트·추이·효과·위험 고객) */
    ChurnSummaryResponse getSummary();
}
