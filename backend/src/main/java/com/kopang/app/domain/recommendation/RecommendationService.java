package com.kopang.app.domain.recommendation;

import java.util.List;

public interface RecommendationService {

    List<RecommendationResponse> getRecommendations(Long userId);
}
