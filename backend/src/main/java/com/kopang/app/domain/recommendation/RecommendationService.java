package com.kopang.app.domain.recommendation;

import java.util.List;

public interface RecommendationService {

    List<RecommendationResponse> getRecommendations(Long userId);

    void markShown(Long recommendId, Long userId);

    void markClicked(Long recommendId, Long userId);

    int attributeConversions();
}
