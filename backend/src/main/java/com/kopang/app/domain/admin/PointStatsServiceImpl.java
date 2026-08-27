package com.kopang.app.domain.admin;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PointStatsServiceImpl implements PointStatsService {

    /** 화면에 한 번에 보여줄 최근 내역 수. 더 필요하면 회원 상세에서 본다. */
    private static final int RECENT_LOG_LIMIT = 100;

    private final PointStatsMapper pointStatsMapper;

    @Override
    public PointStatsResponse getStats() {
        PointStatsResponse response = pointStatsMapper.findTotals();

        List<PointStatsResponse.TierStat> tiers = pointStatsMapper.findTierStats();
        response.setTiers(tiers);
        response.setRecentLogs(pointStatsMapper.findRecentLogs(RECENT_LOG_LIMIT));

        return response;
    }
}
