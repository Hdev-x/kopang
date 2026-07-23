package com.kopang.app.domain.churn;

import java.time.LocalDate;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.kopang.app.domain.churn.ChurnReportResponse.EffectRow;
import com.kopang.app.domain.churn.ChurnReportResponse.Kpi;

/** 대응 효과 리포트 집계 매퍼 (읽기 전용, intervention_outcome 기반) */
@Mapper
public interface ChurnReportMapper {

    // 처치군 기준 KPI (from/to null이면 전체 기간)
    Kpi selectKpi(@Param("from") LocalDate from, @Param("to") LocalDate to);

    // 액션별 순효과 (처치 vs 대조 전환율 + 전환 명수 + 매출)
    List<EffectRow> selectEffect(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
