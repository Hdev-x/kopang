package com.kopang.app.domain.recommendation;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecommendationAdminServiceImpl implements RecommendationAdminService {

    private final RecommendationAdminMapper recommendationAdminMapper;

    @Override
    public RecommendationPerformanceResponse getPerformance() {
        RecommendationPerformanceResponse response = recommendationAdminMapper.findSummary();
        response.setItems(recommendationAdminMapper.findRecentResults());
        return response;
    }
}
