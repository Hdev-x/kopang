package com.kopang.app.domain.churn;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.kopang.app.domain.churn.ChurnSummaryResponse.AtRiskCustomer;
import com.kopang.app.domain.churn.ChurnSummaryResponse.EffectRow;
import com.kopang.app.domain.churn.ChurnSummaryResponse.Kpi;
import com.kopang.app.domain.churn.ChurnSummaryResponse.LevelCount;
import com.kopang.app.domain.churn.ChurnSummaryResponse.SegmentCount;
import com.kopang.app.domain.churn.ChurnSummaryResponse.TrendPoint;
import com.kopang.app.domain.churn.ChurnSummaryResponse.TypeCount;

/** 이탈 대시보드 집계 전용 조회 매퍼 (읽기 전용, 감지/대응 매퍼와 분리) */
@Mapper
public interface ChurnDashboardMapper {

    // KPI — 최신 일별 스냅샷 1행
    Kpi selectLatestKpi();

    // ① 위험 등급별 인원 (user별 최신 판정 기준)
    List<LevelCount> selectLevelCounts();

    // ①-b 일반/멤버십 세그먼트별 고위험
    List<SegmentCount> selectSegmentCounts();

    // ①-c 위험 유형별 인원 (현재 상태 기준 — 임시, 팀 확정 전)
    List<TypeCount> selectTypeCounts();

    // ② 주간 이탈율 추이 (최근 limit일, 과거→현재 정렬)
    List<TrendPoint> selectWeeklyTrend(@Param("limit") int limit);

    // ③ 대응 액션별 처치군 vs 대조군 전환율
    List<EffectRow> selectEffect();

    // ④ 위험 고객 상위 (score 내림차순 limit명)
    List<AtRiskCustomer> selectTopAtRisk(@Param("limit") int limit);
}
