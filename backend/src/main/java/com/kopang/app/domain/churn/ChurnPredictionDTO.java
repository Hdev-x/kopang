package com.kopang.app.domain.churn;

import lombok.Data;

/**
 * ML 이탈 예측 결과 1건. FastAPI /predict/churn 응답의 원소이자 churn_score(source='ML') 저장 소스.
 */
@Data
public class ChurnPredictionDTO {

    private Long userId;
    private Double score;        // 이탈 확률 0~1
    private String riskLevel;    // HIGH / MID / LOW
    private String modelVersion; // 예: v1
}
