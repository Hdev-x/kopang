package com.kopang.app.domain.churn;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChurnScoreServiceImpl implements ChurnScoreService {

    private final ChurnMapper churnMapper;

    @Override
    public void detectLoginInactive() {
        // 1. 미로그인 회원 목록 받기
        List<Long> userIds = churnMapper.findLoginInactiveUsers();

        // 2. 각 회원마다 판정 결과(DTO) 만들어서 저장
        for (Long userId : userIds) {
            //DTO 만들고 값 채우기
            ChurnScoreDTO dto = new ChurnScoreDTO();
            dto.setUserId(userId);
            dto.setScore(0.6);
            dto.setRiskLevel("MID");
            dto.setRiskType("LOGIN_INACTIVE");
            dto.setSource("RULE");
            churnMapper.insertChurnScore(dto);
        }

    }

}
