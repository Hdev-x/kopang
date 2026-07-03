package com.kopang.app.domain.churn;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ChurnScoreDTO {

    private Long churnScoreId;
    private Long userId;
    private Double score;
    private String riskLevel;
    private String riskType;
    private String source;
    private String modelVersion;
    private LocalDateTime scoredAt;


}
