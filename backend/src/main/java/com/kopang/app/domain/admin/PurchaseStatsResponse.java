package com.kopang.app.domain.admin;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PurchaseStatsResponse {

    private Long monthSales;
    private Long orderCount;
    private Long averageOrderValue;
    private Double repeatPurchaseRate;
    private List<MonthlySales> monthlySales;
    private List<TopProduct> topProducts;

    @Getter
    @Setter
    public static class MonthlySales {
        private String month;
        private Long amount;
    }

    @Getter
    @Setter
    public static class TopProduct {
        private Long productId;
        private String name;
        private Long quantity;
        private Double repeatPurchaseRate;
    }
}
