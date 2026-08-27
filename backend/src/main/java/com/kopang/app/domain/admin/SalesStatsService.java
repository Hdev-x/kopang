package com.kopang.app.domain.admin;

/** 매출 통계 서비스 (FR-ADMIN-01) */
public interface SalesStatsService {

    /** 매출 통계 (오늘 KPI + 주간 추이) */
    SalesStatsResponse getSalesStats();
}
