package com.kopang.app.domain.churn;

import java.time.LocalDateTime;

import lombok.Data;

/** 이탈 판정 결과 1건 (룰/ML 공용). churn_score 테이블 1행에 대응 */
@Data
public class ChurnScoreDTO {

    private Long churnScoreId;      // PK
    private Long userId;            // 대상 회원
    private Double score;           // 이탈확률 0~1
    private String riskLevel;       // 등급 LOW/MID/HIGH
    private String riskType;        // 위험유형
    private String source;          // RULE / ML
    private String modelVersion;    // ML 버전
    private LocalDateTime scoredAt; // 판정 시각


}
