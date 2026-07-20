package com.kopang.app.domain.intervention;

import java.time.LocalDateTime;

import lombok.Data;

/** 대응 발송 기록 1건. retention_intervention 테이블 1행에 대응 */
@Data
public class InterventionDTO {

    private Long interventionId;     // PK
    private Long userId;             // 대상 회원
    private Long churnScoreId;       // 어느 감지 때문인지, nullable
    private String riskType;         // 위험 유형
    private String actionType;       // COUPON / PUSH / RECOMMEND / MODAL
    private Long refId;              // 액션 대상(쿠폰·상품) id, nullable
    private Boolean isControl;       // 대조군(무처치) 여부
    private String channel;          // PUSH / EMAIL / IN_APP, nullable
    private String status;           // SENT / FAILED
    private LocalDateTime createdAt; // 생성 시각


}
