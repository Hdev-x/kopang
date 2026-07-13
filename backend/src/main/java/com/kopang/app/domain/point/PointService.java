package com.kopang.app.domain.point;

import java.util.List;

public interface PointService {
    // 1. 회원의 현재 포인트 잔액 조회
    int getBalance(String email);

    // 2. 회원의 포인트 변동 내역 조회
    List<PointHistoryDTO> getHistory(String email);

    // 3. 포인트 적립
    void earnPoints(String email, int amount, String type, String description);

    // 4. 포인트 사용 (차감)
    void usePoints(String email, int amount, String description);
}
