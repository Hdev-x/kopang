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
         * @param type       위험 유형 / null(전체)
         * @param memberType MEMBER / NORMAL / null(전체) — 멤버십 여부 필터
         * @param level      HIGH / MID / LOW / null(전체) — 위험 등급 필터
         * @param limit      페이지 크기
         * @param offset     건너뛸 개수
         */
        List<RiskCustomerResponse> findRiskCustomers(
                        @Param("type") String type,
                        @Param("memberType") String memberType,
                        @Param("level") String level,
                        @Param("limit") int limit,
                        @Param("offset") int offset);

        /** 같은 필터 조건의 총 건수 (페이징·헤더 표시용) */
        long countRiskCustomers(
                        @Param("type") String type,
                        @Param("memberType") String memberType,
                        @Param("level") String level);

        // ===== 상세 (B-2) =====

        /** 프로필 + 멤버십 여부. 없는 userId면 null */
        RiskCustomerDetailResponse.Profile findCustomerProfile(@Param("userId") long userId);

        /** 위험 신호 유형별 요약 (전체 기간 집계 + 유형별 마지막 대응) */
        List<RiskCustomerDetailResponse.SignalSummary> findSignalSummaries(@Param("userId") long userId);

        /** 이탈 점수 이력 최근순 */
        List<RiskCustomerDetailResponse.ScorePoint> findScoreHistory(
                        @Param("userId") long userId, @Param("limit") int limit);

        /** 받은 대응 이력 최근순 (outcome 파생 포함) */
        List<RiskCustomerDetailResponse.InterventionItem> findCustomerInterventions(
                        @Param("userId") long userId, @Param("limit") int limit);

        /** 결제 완료 주문 요약 (건수·누적·평균·최근 주문일) */
        RiskCustomerDetailResponse.OrderSummary findOrderSummary(@Param("userId") long userId);
}
