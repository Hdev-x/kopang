package com.kopang.app.domain.point;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PointMapper {
    // 1. 회원의 현재 총 포인트 잔액 조회 (합산)
    Integer getPointBalance(@Param("userId") Long userId);

    // 2. 회원의 포인트 변동 내역 목록 조회
    List<PointHistoryDTO> findPointHistoryByUserId(@Param("userId") Long userId);

    // 3. 포인트 적립/사용 내역 등록
    void insertPointHistory(PointHistoryDTO history);
}
