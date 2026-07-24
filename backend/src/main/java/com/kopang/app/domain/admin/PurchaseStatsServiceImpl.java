package com.kopang.app.domain.admin;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PurchaseStatsServiceImpl implements PurchaseStatsService {

    private final PurchaseStatsMapper purchaseStatsMapper;

    @Override
    public PurchaseStatsResponse getStats() {
        PurchaseStatsResponse response = purchaseStatsMapper.findSummary();
        response.setMonthlySales(purchaseStatsMapper.findMonthlySales());
        response.setTopProducts(purchaseStatsMapper.findTopProducts());
        return response;
    }
}
