package com.kopang.app.domain.recommendation;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecommendationPerformanceResponse {

    private Long recommendationCount;
    private Long shownCount;
    private Long clickCount;
    private Long conversionCount;
    private Double clickRate;
    private Double conversionRate;
    private Long revenue;
    private List<ResultItem> items;

    @Getter
    @Setter
    public static class ResultItem {
        private Long recommendId;
        private String userName;
        private String productName;
        private Double score;
        private String reason;
        private Boolean shown;
        private Boolean clicked;
        private Boolean converted;
    }
}
