package com.kopang.app.domain.admin;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PointStatsMapper {

    PointStatsResponse findTotals();

    List<PointStatsResponse.TierStat> findTierStats();

    List<PointStatsResponse.PointLog> findRecentLogs(@Param("limit") int limit);
}
