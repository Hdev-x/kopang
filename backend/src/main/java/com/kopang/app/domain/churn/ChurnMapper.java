package com.kopang.app.domain.churn;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ChurnMapper {
    
    // 1. 30일 미로그인 회원 목록 조회
    List<Long> findLoginInactiveUsers();
    // 2. 이탈 점수 저장
    void insertChurnScore(ChurnScoreDTO score);

}
