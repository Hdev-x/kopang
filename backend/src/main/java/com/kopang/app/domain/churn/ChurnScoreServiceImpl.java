package com.kopang.app.domain.churn;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.kopang.app.domain.intervention.InterventionRequest;
import com.kopang.app.domain.intervention.InterventionService;
import com.kopang.app.domain.intervention.InterventionDTO;
import com.kopang.app.domain.notification.NotificationDTO;
import com.kopang.app.domain.notification.NotificationMapper;
import com.kopang.app.domain.coupon.CouponMapper;
import com.kopang.app.domain.coupon.CouponDTO;
import com.kopang.app.domain.coupon.UserCouponDTO;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChurnScoreServiceImpl implements ChurnScoreService {

    private final ChurnMapper churnMapper;
    private final NotificationMapper notificationMapper;
    private final InterventionService interventionService;
    private final CouponMapper couponMapper;

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

    // 쿠폰 자동 지급 헬퍼 메서드
    private void autoIssueCoupon(Long userId, Long couponId) {
        try {
            int existingCount = couponMapper.countUserCouponByCouponId(userId, couponId);
            if (existingCount > 0) {
                return; // 이미 발급받았으면 패스
            }
            CouponDTO coupon = couponMapper.findCouponById(couponId);
            if (coupon == null || coupon.getQuantity() <= 0) {
                return; // 쿠폰이 없거나 품절이면 패스
            }
            couponMapper.decreaseCouponQuantity(couponId);
            UserCouponDTO userCoupon = UserCouponDTO.builder()
                    .userId(userId)
                    .couponId(couponId)
                    .used(false)
                    .issuedAt(new java.util.Date())
                    .expiresAt(coupon.getEndDate())
                    .build();
            couponMapper.insertUserCoupon(userCoupon);
        } catch (Exception e) {
            System.err.println("[자동 쿠폰 발급 오류] userId: " + userId + ", couponId: " + couponId + " - " + e.getMessage());
        }
    }

    // 대응 발송 — 오늘자 감지 위험 대상에 대조군 분리 후 알림 발송 + 전원 기록
    @Transactional
    @Override
    public void runInterventions() {
        // 조회
        List<ChurnScoreDTO> targets = churnMapper.findInterventionTargets();

        // ① 판정 + 로그 (전원, bulk 1번) — 반환 = 발송해야 할 처치군 userId
        List<InterventionRequest> reqs = new ArrayList<>();
        for (ChurnScoreDTO target : targets) {
            if ("WISHLIST_IDLE".equals(target.getRiskType())) {
                continue; // 찜 방치는 CHURN-13(할인 시 알림)에서 처리하므로 독촉 발송 제외
            }
            reqs.add(toRequest(target));
        }
        Set<Long> toSend = new HashSet<>(interventionService.recordAndCheckControl(reqs));

        // ② 발송 (처치군만) — riskType별 알림 만들어 notifications INSERT
        for (ChurnScoreDTO target : targets) {
            if ("WISHLIST_IDLE".equals(target.getRiskType())) {
                continue; // 찜 방치는 CHURN-13(할인 시 알림)에서 처리하므로 독촉 발송 제외
            }
            if (!toSend.contains(target.getUserId())) {
                continue; // 대조군 → 발송 스킵
            }
            String type;
            String message;
            Long refId = null;

            switch (target.getRiskType()) {
                case "CART_ABANDON" -> {
                    type = "ABANDON";
                    message = "장바구니에 상품이 남아있어요. 잊지 말고 구매해 보세요! 🛒";
                    refId = 3L; // 장바구니 리마인드 5% 쿠폰 ID
                    autoIssueCoupon(target.getUserId(), refId);
                }
                case "MEMBERSHIP_CANCEL" -> {
                    type = "COMEBACK";
                    message = "와우 멤버십 혜택을 계속 이용해 보세요! 혜택 유지 특별 쿠폰이 지급되었습니다. 🎁";
                    refId = 6L; // 멤버십 갱신 15% 쿠폰 ID
                    autoIssueCoupon(target.getUserId(), refId);
                }
                case "FIRST_ORDER_ONLY" -> {
                    type = "COMEBACK";
                    message = "돌아오신 것을 환영해요! 복귀 기념 특별 5,000원 할인 쿠폰이 발급되었습니다. 💖";
                    refId = 4L; // 복귀 5000원 쿠폰 ID
                    autoIssueCoupon(target.getUserId(), refId);
                }
                case "COUPON_EXPIRING" -> {
                    type = "COUPON_EXPIRE";
                    message = "[리마인드] 보유하신 미사용 쿠폰이 곧 만료됩니다! 만료 전에 꼭 사용해 보세요. 🎟️";
                }
                case "BAD_EXPERIENCE" -> {
                    type = "APOLOGY";
                    message = "이용에 불편을 드려 죄송합니다. 사과의 마음을 담은 특별 할인 쿠폰이 도착했습니다. 🙇";
                    refId = 5L; // 사과 쿠폰 10%
                    autoIssueCoupon(target.getUserId(), refId);
                }
                case "LOGIN_INACTIVE" -> {
                    type = "COMEBACK";
                    message = "오랜만에 뵙네요! 복귀 기념 특별 5,000원 할인 쿠폰이 발급되었습니다. 💖";
                    refId = 4L; // 복귀 5000원 쿠폰 ID
                    autoIssueCoupon(target.getUserId(), refId);
                }
                case "SPENDING_DROP" -> {
                    type = "REBUY";
                    message = "요즘 뜸하셨네요, 다시 찾아주신 감사함으로 재구매 할인 쿠폰을 드립니다. 🛍️";
                    refId = 8L; // 재구매 감사 5%
                    autoIssueCoupon(target.getUserId(), refId);
                }
                default -> {
                    // 예외 처리 대신 기본값 처리로 예기치 못한 타입에 대한 오류 방지
                    type = "NOTICE";
                    message = "코팡이 준비한 맞춤형 특별 혜택을 확인해 보세요!";
                }
            }
            NotificationDTO noti = new NotificationDTO();
            noti.setUserId(target.getUserId());
            noti.setType(type);
            noti.setMessage(message);
            noti.setRefId(refId);
            noti.setIsRead(false);
            noti.setClicked(false);
            notificationMapper.insertNotification(noti);
        }
    }

    @Transactional
    @Override
    public void runCouponExpiringInterventions() {
        List<ChurnScoreDTO> targets = churnMapper.findTargetsByRiskTypes(List.of("COUPON_EXPIRING"));
        if (targets.isEmpty()) {
            return;
        }

        List<InterventionDTO> logs = new ArrayList<>();
        for (ChurnScoreDTO target : targets) {
            InterventionDTO log = new InterventionDTO();
            log.setUserId(target.getUserId());
            log.setChurnScoreId(target.getChurnScoreId());
            log.setRiskType("COUPON_EXPIRING");
            log.setActionType("PUSH");
            log.setIsControl(false); // 운영성 안내로 대조군 제외
            log.setChannel("IN_APP");
            logs.add(log);
        }

        // 1. 대조군 없이 100% 벌크 저장
        churnMapper.insertInterventions(logs);

        // 2. 100% 알림 전송
        for (ChurnScoreDTO target : targets) {
            NotificationDTO noti = new NotificationDTO();
            noti.setUserId(target.getUserId());
            noti.setType("COUPON_EXPIRE");
            noti.setMessage("[리마인드] 보유하신 미사용 쿠폰이 곧 만료됩니다! 만료 전에 꼭 사용해 보세요. 🎟️");
            noti.setIsRead(false);
            noti.setClicked(false);
            notificationMapper.insertNotification(noti);
        }
    }

    @Transactional
    @Override
    public void runLoginInactiveInterventions() {
        List<ChurnScoreDTO> targets = churnMapper.findTargetsByRiskTypes(List.of("LOGIN_INACTIVE"));
        List<InterventionRequest> reqs = new ArrayList<>();
        for (ChurnScoreDTO target : targets) {
            reqs.add(new InterventionRequest(
                    target.getUserId(),
                    target.getChurnScoreId(),
                    "LOGIN_INACTIVE",
                    "PUSH",
                    "IN_APP"));
        }

        Set<Long> toSend = new HashSet<>(interventionService.recordAndCheckControl(reqs));

        for (ChurnScoreDTO target : targets) {
            if (!toSend.contains(target.getUserId())) {
                continue;
            }
            // 복귀 5,000원 쿠폰 지급
            autoIssueCoupon(target.getUserId(), 4L);

            NotificationDTO noti = new NotificationDTO();
            noti.setUserId(target.getUserId());
            noti.setType("COMEBACK");
            noti.setMessage("오랜만에 뵙네요! 복귀 기념 특별 5,000원 할인 쿠폰이 발급되었습니다. 💖");
            noti.setRefId(4L);
            noti.setIsRead(false);
            noti.setClicked(false);
            notificationMapper.insertNotification(noti);
        }
    }
}
