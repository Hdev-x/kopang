package com.kopang.app.domain.churn;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChurnDashboardServiceImpl implements ChurnDashboardService {

    private final ChurnDashboardMapper dashboardMapper;

    // 화면 고정값: 추이 6주, 위험 고객 미리보기 5명
    private static final int TREND_WEEKS = 6;
    private static final int TOP_AT_RISK = 5;

    @Override
    public ChurnSummaryResponse getSummary() {
        ChurnSummaryResponse res = new ChurnSummaryResponse();
        res.setKpi(dashboardMapper.selectLatestKpi());
        res.setLevelCounts(dashboardMapper.selectLevelCounts());
        res.setTypeCounts(dashboardMapper.selectTypeCounts());
        res.setLastRuleRunAt(dashboardMapper.selectLastRuleRunAt());

        // ⑤ 운영 현황: 카운트 쿼리 + 커버리지 쿼리 결과를 한 객체로 합침
        ChurnSummaryResponse.OpsSummary ops = dashboardMapper.selectOpsCounts();
        ChurnSummaryResponse.OpsSummary coverage = dashboardMapper.selectHighCoverage();
        ops.setHighTotal(coverage.getHighTotal());
        ops.setHighCovered(coverage.getHighCovered());
        res.setOps(ops);

        res.setMlCover(dashboardMapper.selectMlCover());
        res.setSegments(dashboardMapper.selectSegmentCounts());
        res.setWeeklyChurnRate(dashboardMapper.selectWeeklyTrend(TREND_WEEKS));
        res.setEffect(dashboardMapper.selectEffect());
        res.setAtRisk(dashboardMapper.selectTopAtRisk(TOP_AT_RISK));
        return res;
    }
}
