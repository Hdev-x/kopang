package com.kopang.app.domain.churn;

import java.util.List;

import com.kopang.app.domain.intervention.InterventionRequest;
import com.kopang.app.domain.intervention.InterventionService;
import com.kopang.app.domain.notification.NotificationDTO;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChurnScoreServiceImpl implements ChurnScoreService {

    private final ChurnMapper churnMapper;
    private final InterventionService interventionService;

    // ============================================
    // 감지 (룰별 → churn_score 저장)
    // ============================================

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

    // 룰1) 장바구니 방치
    @Override
    public void detectCartAbandon() {
        save(
                churnMapper.findCartAbandonUsers(),
                0.5,
                "MID",
                "CART_ABANDON");
    }

    // 룰2) 멤버십 해지 → 능동 신호라 높게 (0.7/HIGH)
    @Override
    public void detectMembershipCancel() {
        save(
                churnMapper.findMembershipCancelUsers(),
                0.7,
                "HIGH",
                "MEMBERSHIP_CANCEL");
    }

    // 룰3) 첫구매 후 30일 미복귀 (0.6/MID)
    @Override
    public void detectFirstOrderOnly() {
        save(
                churnMapper.findFirstOrderOnlyUsers(),
                0.6,
                "MID",
                "FIRST_ORDER_ONLY");
    }

    // 룰4) 찜 7일 경과 + 해당 상품 미주문
    @Override
    public void detectWishlistIdle() {
        save(
                churnMapper.findWishlistIdleUsers(),
                0.4,
                "LOW",
                "WISHLIST_IDLE");
    }

    // 룰5) 쿠폰 만료 임박 (0.5/MID)
    @Override
    public void detectCouponExpiring() {
        save(
                churnMapper.findCouponExpiringUsers(),
                0.5,
                "MID",
                "COUPON_EXPIRING");
    }

    // 룰6) 부정경험 (0.7/HIGH)
    @Override
    public void detectBadExperience() {
        save(
                churnMapper.findBadExperienceUsers(),
                0.7,
                "HIGH",
                "BAD_EXPERIENCE");
    }

    // 룰7) 30일 미로그인 (0.6/MID)
    @Override
    public void detectLoginInactive() {
        save(
                churnMapper.findLoginInactiveUsers(),
                0.6,
                "MID",
                "LOGIN_INACTIVE");
    }

    // 룰8) 최근 30일 지출 < 직전 30일의 50%
    @Override
    public void detectSpendingDrop() {
        save(
                churnMapper.findSpendingDropUsers(),
                0.6,
                "MID",
                "SPENDING_DROP");
    }

    // 룰 8종 전체 실행 — 수동(/run)과 스케줄러(CHURN-06)가 공유
    @Transactional
    @Override
    public void runAllRules() {
        churnMapper.deleteTodayRuleScores();
        detectWishlistIdle();
        detectCartAbandon();
        detectLoginInactive();
        detectFirstOrderOnly();
        detectMembershipCancel();
        detectCouponExpiring();
        detectSpendingDrop();
        detectBadExperience();
    }

    // ============================================
    // 대응 (intervention)
    // ============================================

    // ChurnScoreDTO(조회 대상) → InterventionRequest 변환 (꺼내오기 숨김)
    private InterventionRequest toRequest(ChurnScoreDTO target) {
        return new InterventionRequest(
                target.getUserId(),
                target.getChurnScoreId(),
                target.getRiskType(),
                "PUSH",
                "IN_APP");
    }

    // 대응 발송 — 오늘자 ④⑧ 대상에 대조군 분리 후 알림 발송 + 전원 기록
    @Transactional
    @Override
    public void runInterventions() {
        // 조회
        List<ChurnScoreDTO> targets = churnMapper.findInterventionTargets();
        for (ChurnScoreDTO target : targets) {
            Long userId = target.getUserId();

            // ① 판정 + 로그 (전원) — 공통 메서드에 위임, 반환 = 대조군 여부
            InterventionRequest req = toRequest(target);
            boolean isControl = interventionService.recordAndCheckControl(req);

            // ② 발송 (처치군만) — riskType별 알림 만들어 notifications INSERT
            if (!isControl) {
                String type;
                String message;
                switch (target.getRiskType()) {
                    case "WISHLIST_IDLE" -> {
                        type = "WISHLIST";
                        message = "찜하신 상품이 기다려요";
                    }
                    case "SPENDING_DROP" -> {
                        type = "REBUY";
                        message = "요즘 뜸하셨네요, 특가 준비했어요";
                    }
                    default -> throw new IllegalArgumentException("모르는 유형: " + target.getRiskType());
                }
                NotificationDTO noti = new NotificationDTO();
                noti.setUserId(userId);
                noti.setType(type);
                noti.setMessage(message);
                churnMapper.insertNotification(noti);
            }
        }
    }

}
