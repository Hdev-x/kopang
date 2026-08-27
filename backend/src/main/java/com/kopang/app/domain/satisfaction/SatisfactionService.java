package com.kopang.app.domain.satisfaction;

/** 만족도 수집 서비스 (CHURN-17) */
public interface SatisfactionService {

    /** 만족도 제출 (score 1~5 검증) */
    void submit(Long userId, SatisfactionRequest req);

    /** 조사 노출 가능 여부 — 최근 90일 내 제출 이력 없을 때만 true (3개월 1회 정책) */
    boolean isEligible(Long userId);
}
