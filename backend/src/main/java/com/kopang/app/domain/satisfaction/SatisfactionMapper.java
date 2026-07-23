package com.kopang.app.domain.satisfaction;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** 만족도 수집 매퍼 (CHURN-17). satisfaction_survey 테이블 */
@Mapper
public interface SatisfactionMapper {

    /** 만족도 1건 저장 */
    void insertSatisfaction(@Param("userId") Long userId, @Param("req") SatisfactionRequest req);
}
