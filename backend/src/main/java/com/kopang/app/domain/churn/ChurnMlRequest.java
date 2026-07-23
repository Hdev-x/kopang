package com.kopang.app.domain.churn;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * FastAPI /predict/churn 요청 본문. serve.py 의 PredictRequest 와 형태 일치.
 * { "users": [ { "userId": 1, "features": { "recency_days": 30, ... } } ] }
 */
@Data
public class ChurnMlRequest {

    private List<UserInput> users;

    @Data
    @AllArgsConstructor
    public static class UserInput {
        private Long userId;
        private Map<String, Object> features; // 피처명(snake_case) → 값
    }
}
