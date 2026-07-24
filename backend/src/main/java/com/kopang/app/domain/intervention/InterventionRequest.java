package com.kopang.app.domain.intervention;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 대응 기록 요청 값 묶음. recordAndCheckControl() 호출 시 넘김 (로그 저장용 InterventionDTO와 별개) */
@Data
@AllArgsConstructor
public class InterventionRequest {

    private Long userId;        // 대상 회원
    private Long churnScoreId;  // 어느 감지 때문인지
    private String riskType;    // 위험 유형
    private String actionType;  // COUPON / PUSH / MODAL ...
    private String channel;     // IN_APP / EMAIL / PUSH

}
