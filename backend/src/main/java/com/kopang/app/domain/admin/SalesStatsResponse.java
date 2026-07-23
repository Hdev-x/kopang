package com.kopang.app.domain.admin;

import java.time.LocalDate;
import java.util.List;

import lombok.Data;

/**
 * 매출 통계 응답 (GET /api/admin/stats/sales). 관리자 대시보드 상단 KPI + 주간 추이 (FR-ADMIN-01).
 * 모두 "오늘/최근 N일 기준" — 실제 오늘 데이터가 있어야 채워짐(데모는 daily_activity 스크립트로 주입).
 */
@Data
public class SalesStatsResponse {

    private Long todaySales;    // 오늘 결제완료 매출 합계
    private Integer todayOrders; // 오늘 주문 건수
    private Integer newMembers;  // 오늘 신규 가입 수
    private List<DailySales> weeklySales; // 최근 7일 일별 매출 (과거→오늘)

    /** 일별 매출 1점 */
    @Data
    public static class DailySales {
        private LocalDate date;
        private Long amount;
    }
}
