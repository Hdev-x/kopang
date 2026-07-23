package com.kopang.app.domain.churn;

import java.util.List;

import lombok.Data;

/**
 * FastAPI /predict/churn 응답 전체. RestClient 가 JSON { "results": [...] } 를 이 타입으로 변환.
 */
@Data
public class ChurnMlResponse {

    private List<ChurnPredictionDTO> results;
}
