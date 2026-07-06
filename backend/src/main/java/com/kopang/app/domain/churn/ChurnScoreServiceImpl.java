package com.kopang.app.domain.churn;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChurnScoreServiceImpl implements ChurnScoreService {

    private final ChurnMapper churnMapper;

    // 공통 저장: 대상 목록을 받아 회원마다 판정 결과(DTO)를 churn_score에 저장
    private void save(List<Long> userIds, double score, String level, String type) {
        for (Long id : userIds) {
            ChurnScoreDTO dto = new ChurnScoreDTO();
            dto.setUserId(id);
            dto.setScore(score);
            dto.setRiskLevel(level);
            dto.setRiskType(type);
            dto.setSource("RULE");
            churnMapper.insertChurnScore(dto);
        }
    }


    // 룰2) 멤버십 해지 → 능동 신호라 높게 (0.7/HIGH)
    @Override
    public void detectMembershipCancel() {
        save(
            churnMapper.findMembershipCancelUsers(),
            0.7,
            "HIGH",
            "MEMBERSHIP_CANCEL"
        );
    }

    
    // 룰3) 첫구매 후 30일 미복귀 (0.6/MID)
    @Override
    public void detectFirstOrderOnly() {
        save(
            churnMapper.findFirstOrderOnlyUsers(),
            0.6,
            "MID",
            "FIRST_ORDER_ONLY"
        );
    }


    // 룰5) 쿠폰 만료 임박 (0.5/MID)
    @Override
    public void detectCouponExpiring() {
        save(
            churnMapper.findCouponExpiringUsers(),
            0.5, 
            "MID", 
            "COUPON_EXPIRING"
        );
    }


    // 룰7) 30일 미로그인 (0.6/MID)
    @Override
    public void detectLoginInactive() {
        save(
            churnMapper.findLoginInactiveUsers(),
            0.6,
            "MID",
            "LOGIN_INACTIVE"
        );
    }

}
