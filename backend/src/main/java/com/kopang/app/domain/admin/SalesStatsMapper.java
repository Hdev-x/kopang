package com.kopang.app.domain.admin;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.kopang.app.domain.admin.SalesStatsResponse.DailySales;

/** 매출 통계 집계 매퍼 (FR-ADMIN-01, 읽기 전용) */
@Mapper
public interface SalesStatsMapper {

    // 오늘 결제완료 매출 합계 (orders)
    long selectTodaySales();

    // 오늘 주문 건수 (orders)
    int selectTodayOrders();

    // 오늘 신규 가입 수 (users)
    int selectNewMembers();

    // 최근 7일 일별 매출 (과거→오늘)
    List<DailySales> selectWeeklySales();
}
