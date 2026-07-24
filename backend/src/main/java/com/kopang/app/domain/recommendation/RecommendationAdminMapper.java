package com.kopang.app.domain.recommendation;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RecommendationAdminMapper {

    RecommendationPerformanceResponse findSummary();

    List<RecommendationPerformanceResponse.ResultItem> findRecentResults();
}
