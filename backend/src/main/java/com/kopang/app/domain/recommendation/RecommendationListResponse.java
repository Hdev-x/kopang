package com.kopang.app.domain.recommendation;

import java.util.List;

public record RecommendationListResponse(
        String title,
        List<RecommendationResponse> items) {
}
