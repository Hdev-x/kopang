package com.kopang.app.domain.intervention;

import java.time.LocalDateTime;

import lombok.Data;

/**
 * 대응 이력 조회 1행 (GET /api/admin/interventions).
 * retention_intervention + intervention_outcome + users 조인 결과.
 */
@Data
public class InterventionLogResponse {

    private LocalDateTime createdAt; // 발송 시각
    private String userName;         // 대상 회원 이름
    private String userEmail;        // 대상 회원 이메일 (계정 식별용)
    private String actionType;       // COUPON / PUSH / MODAL / RECOMMEND
    private String channel;          // PUSH / EMAIL / IN_APP
    private Boolean isControl;       // 대조군 여부
    private String riskType;         // 위험 유형
    private String outcome;          // CONTROL / CONVERTED / NO_RESPONSE (서버 계산)
}
