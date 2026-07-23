package com.kopang.app.domain.churn;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 위험 고객 목록 응답 (목록 + 총 건수) */
@Data
@AllArgsConstructor
public class RiskCustomerListResponse {
    private List<RiskCustomerResponse> content; // 현재 페이지 목록
    private long totalElements;                 // 필터 조건 전체 건수
}
