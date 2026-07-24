package com.kopang.app.domain.churn;

/** 위험 고객 목록 조회 서비스 (FR-ADMIN-08) */
public interface ChurnCustomerService {

    /**
     * 위험 고객 목록 (필터 + 페이징).
     * @param type       위험 유형 8종 / ML_HIGH / null(전체)
     * @param memberType MEMBER / NORMAL / null(전체)
     * @param level      HIGH / MID / LOW / null(전체)
     * @param page       0부터
     * @param size       페이지 크기
     */
    RiskCustomerListResponse getRiskCustomers(String type, String memberType, String level, int page, int size);
}
