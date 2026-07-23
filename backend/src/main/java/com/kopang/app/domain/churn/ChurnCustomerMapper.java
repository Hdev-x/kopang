package com.kopang.app.domain.churn;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** 위험 고객 목록 조회 매퍼 (FR-ADMIN-08, 읽기 전용) */
@Mapper
public interface ChurnCustomerMapper {

        /**
         * 위험 고객 목록 (user별 최신 판정 기준, score 내림차순).
         * 
         * @param memberType MEMBER / NORMAL / null(전체) — 멤버십 여부 필터
         * @param level      HIGH / MID / LOW / null(전체) — 위험 등급 필터
         * @param limit      페이지 크기
         * @param offset     건너뛸 개수
         */
        List<RiskCustomerResponse> findRiskCustomers(
                        @Param("memberType") String memberType,
                        @Param("level") String level,
                        @Param("limit") int limit,
                        @Param("offset") int offset);

        /** 같은 필터 조건의 총 건수 (페이징·헤더 표시용) */
        long countRiskCustomers(
                        @Param("memberType") String memberType,
                        @Param("level") String level);
}
