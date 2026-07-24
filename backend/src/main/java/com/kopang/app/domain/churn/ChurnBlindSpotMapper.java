package com.kopang.app.domain.churn;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ChurnBlindSpotMapper {

    List<ChurnBlindSpotTarget> findTargets(@Param("limit") int limit);
}
