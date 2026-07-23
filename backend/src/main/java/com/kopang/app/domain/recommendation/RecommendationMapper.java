package com.kopang.app.domain.recommendation;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RecommendationMapper {

    List<RecommendationResponse> findTodayRecommendations(@Param("userId") Long userId);

    List<RecommendationResponse> findItemCfCandidates(
            @Param("userId") Long userId, @Param("limit") int limit);

    List<RecommendationResponse> findPopularCandidates(
            @Param("userId") Long userId, @Param("limit") int limit);

    int insertRecommendations(
            @Param("userId") Long userId,
            @Param("items") List<RecommendationResponse> items);
}
