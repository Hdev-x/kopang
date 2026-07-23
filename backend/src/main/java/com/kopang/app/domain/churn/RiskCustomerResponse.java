package com.kopang.app.domain.churn;

import java.time.LocalDate;

import lombok.Data;

/**
 * 위험 고객 목록 1행 (GET /api/admin/churn/customers). CHURN-09 위험고객 쿼리에
 * 타입/등급 필터 + 대응 발송 상태를 더한 관리자용 목록 (FR-ADMIN-08).
 */
@Data
public class RiskCustomerResponse {

    private Long userId;
    private String name;
    private Boolean isMember;   // 멤버십(ACTIVE) 여부
    private Double score;       // 이탈 확률 0~1
    private String riskLevel;   // HIGH / MID / LOW
    private String riskType;    // 위험 유형 (프론트가 라벨·추천대응으로 매핑)
    private LocalDate detectedAt; // 판정일 (churn_score.scored_at)
    private String status;      // 대응 상태: SCHEDULED(예정) / SENT(발송됨) / CONTROL(대조군)
}
