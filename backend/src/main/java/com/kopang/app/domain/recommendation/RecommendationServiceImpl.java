package com.kopang.app.domain.recommendation;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private static final int DEFAULT_LIMIT = 10;

    private final RecommendationMapper recommendationMapper;

    @Override
    @Transactional
    public List<RecommendationResponse> getRecommendations(Long userId) {
        List<RecommendationResponse> saved =
                recommendationMapper.findTodayRecommendations(userId);
        if (!saved.isEmpty()) {
            return saved;
        }

        List<RecommendationResponse> candidates =
                recommendationMapper.findItemCfCandidates(userId, DEFAULT_LIMIT);
        if (candidates.isEmpty()) {
            candidates = recommendationMapper.findPopularCandidates(userId, DEFAULT_LIMIT);
        }
        if (candidates.isEmpty()) {
            return List.of();
        }

        recommendationMapper.insertRecommendations(userId, candidates);
        return recommendationMapper.findTodayRecommendations(userId);
    }
}
