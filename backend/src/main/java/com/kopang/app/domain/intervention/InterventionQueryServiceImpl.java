package com.kopang.app.domain.intervention;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InterventionQueryServiceImpl implements InterventionQueryService {

    private final InterventionQueryMapper queryMapper;

    // 이력 화면 미리보기 상한 (4천여 건 전체 대신 최근 N건)
    private static final int LOG_LIMIT = 200;

    @Override
    public List<InterventionLogResponse> getLogs(String riskType) {
        return queryMapper.selectInterventionLogs(riskType, LOG_LIMIT);
    }
}
