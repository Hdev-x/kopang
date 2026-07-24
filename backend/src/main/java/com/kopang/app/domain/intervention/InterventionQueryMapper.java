package com.kopang.app.domain.intervention;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** 대응 이력 조회 매퍼 (읽기 전용, 발송 기록용 ChurnMapper와 분리) */
@Mapper
public interface InterventionQueryMapper {

    /**
     * 대응 이력 최근순 조회.
     * @param riskType 위험 유형 필터 (null이면 전체)
     * @param limit    최대 건수
     */
    List<InterventionLogResponse> selectInterventionLogs(
            @Param("riskType") String riskType,
            @Param("limit") int limit);
}
