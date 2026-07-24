package com.kopang.app.domain.intervention;

import java.util.List;

/** 대응 이력 조회 서비스 */
public interface InterventionQueryService {

    /** 대응 이력 최근순 조회 (riskType null이면 전체) */
    List<InterventionLogResponse> getLogs(String riskType);
}
