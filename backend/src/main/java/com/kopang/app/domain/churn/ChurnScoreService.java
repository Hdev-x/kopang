package com.kopang.app.domain.churn;

public interface ChurnScoreService {
    // "미로그인 회원 감지+판정+저장" 전체 = 요리 한 접시
    void detectLoginInactive();

}
