package com.kopang.app.domain.satisfaction;

/** 만족도 수집 서비스 (CHURN-17) */
public interface SatisfactionService {

    /** 만족도 제출 (score 1~5 검증) */
    void submit(Long userId, SatisfactionRequest req);
}
