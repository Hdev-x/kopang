package com.kopang.app.domain.admin;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PurchaseStatsMapper {

    PurchaseStatsResponse findSummary();

    List<PurchaseStatsResponse.MonthlySales> findMonthlySales();

    List<PurchaseStatsResponse.TopProduct> findTopProducts();
}
