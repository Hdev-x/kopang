package com.kopang.app.domain.admin;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalesStatsServiceImpl implements SalesStatsService {

    private final SalesStatsMapper salesStatsMapper;

    @Override
    public SalesStatsResponse getSalesStats() {
        SalesStatsResponse res = new SalesStatsResponse();
        res.setTodaySales(salesStatsMapper.selectTodaySales());
        res.setTodayOrders(salesStatsMapper.selectTodayOrders());
        res.setNewMembers(salesStatsMapper.selectNewMembers());
        res.setTotalSales(salesStatsMapper.selectTotalSales());
        res.setMonthSales(salesStatsMapper.selectMonthSales());
        res.setWeeklySales(salesStatsMapper.selectWeeklySales());
        return res;
    }
}
