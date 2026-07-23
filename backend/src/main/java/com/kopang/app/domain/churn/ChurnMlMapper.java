package com.kopang.app.domain.churn;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** ML 이탈 예측 배치 매퍼 (CHURN-02/06 ML 확장) */
@Mapper
public interface ChurnMlMapper {

    /** 전체 회원 피처 조회 (aggregate_profiles.sql = 학습 CSV와 동일 집계) */
    List<ChurnFeatureDTO> selectFeatures();

    /** 예측 결과를 churn_score(source='ML')로 bulk 저장 */
    void insertMlScores(@Param("list") List<ChurnPredictionDTO> scores);

    /** 재실행 대비 멱등성: 오늘자 ML 점수 삭제 후 재삽입 (CHURN-06 룰 배치와 같은 방식) */
    void deleteTodayMlScores();
}
