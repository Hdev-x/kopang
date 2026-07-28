package com.kopang.app.domain.churn;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.kopang.app.domain.intervention.InterventionRequest;
import com.kopang.app.domain.intervention.InterventionService;
import com.kopang.app.domain.notification.NotificationDTO;
import com.kopang.app.domain.notification.NotificationMapper;
import com.kopang.app.domain.coupon.CouponMapper;
import com.kopang.app.domain.coupon.CouponDTO;

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
    private final ChurnMetricMapper churnMetricMapper;
    private final com.kopang.app.domain.intervention.InterventionOutcomeMapper outcomeMapper;
    private final ChurnMlService churnMlService;

    // 자동 발송 스위치. false면 배치가 감지·측정·지표만 하고 발송은 건너뛴다.
    // (관리자 화면의 개별 발송 버튼은 이 값과 무관하게 동작한다)
    @org.springframework.beans.factory.annotation.Value("${churn.intervention.enabled}")
    private boolean interventionEnabled;

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

    /**
     * 발송 대상을 앞에서 n 명만 남긴다 (limit <= 0 이면 그대로).
     * 검증용 경로다 — 수천 명에게 실제 알림·쿠폰이 나가기 전에 소수로 확인한다.
     */
    private static List<ChurnScoreDTO> capped(List<ChurnScoreDTO> targets, int limit) {
        if (limit <= 0 || targets.size() <= limit) {
            return targets;
        }
        return new ArrayList<>(targets.subList(0, limit));
    }

    /**
     * 쿠폰 자동 지급. **발급했는지 여부를 돌려준다.**
     *
     * 반환값이 필요한 이유: 이미 가지고 있거나 품절이면 발급을 건너뛰는데,
     * 호출부가 그걸 모르고 "쿠폰이 발급되었습니다" 알림을 보내면
     * 고객은 알림을 받고 쿠폰함에서 아무것도 못 찾는다.
     */
    private boolean autoIssueCoupon(Long userId, Long couponId) {
        try {
            int existingCount = couponMapper.countUserCouponByCouponId(userId, couponId);
            if (existingCount > 0) {
                return false; // 이미 발급받았으면 패스
            }
            CouponDTO coupon = couponMapper.findCouponById(couponId);
            if (coupon == null || coupon.getQuantity() <= 0) {
                return false; // 쿠폰이 없거나 품절이면 패스
            }
            couponMapper.decreaseCouponQuantity(couponId);
            // issued_by='CHURN' 을 남긴다 — 원복이 이 배치가 발급한 쿠폰만 회수하려면
            // 출처가 필요하다. 없으면 같은 날 받은 이벤트 쿠폰까지 삭제된다.
            churnMapper.insertChurnUserCoupon(userId, couponId, coupon.getEndDate());
            return true;
        } catch (Exception e) {
            System.err.println("[자동 쿠폰 발급 오류] userId: " + userId + ", couponId: " + couponId + " - " + e.getMessage());
            return false;
        }
    }

    // 발송 실행 전 대상 현황 — 3갈래(통합·쿠폰만료·미로그인) 후보 수만 읽기 조회
    @Transactional(readOnly = true)
    @Override
    public InterventionPreviewResponse getInterventionPreview() {
        int integrated = (int) churnMapper.findInterventionTargets().stream()
                .filter(t -> !"WISHLIST_IDLE".equals(t.getRiskType()))
                .count();
        int couponExpiring = churnMapper.findTargetsByRiskTypes(List.of("COUPON_EXPIRING")).size();
        int loginInactive = churnMapper.findTargetsByRiskTypes(List.of("LOGIN_INACTIVE")).size();
        return new InterventionPreviewResponse(integrated, couponExpiring, loginInactive);
    }

    // 대응 발송 — 오늘자 감지 위험 대상에 대조군 분리 후 알림 발송 + 전원 기록
    @Transactional
    @Override
    public InterventionRunResult runInterventions() {
        return runInterventions(0);
    }

    @Transactional
    @Override
    public InterventionRunResult runInterventions(int limit) {
        // 조회
        List<ChurnScoreDTO> targets = capped(churnMapper.findInterventionTargets(), limit);

        // ① 판정 + 로그 (전원, bulk 1번) — 반환 = 발송해야 할 처치군 userId
        List<InterventionRequest> reqs = new ArrayList<>();
        for (ChurnScoreDTO target : targets) {
            if ("WISHLIST_IDLE".equals(target.getRiskType())) {
                continue; // 찜 방치는 CHURN-13(할인 시 알림)에서 처리하므로 독촉 발송 제외
            }
            reqs.add(toRequest(target));
        }
        var split = interventionService.recordAndCheckControl(reqs);
        Set<Long> toSend = new HashSet<>(split.treatment());

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

            /*
             * 통합 발송이 처리하는 유형은 FIRST_ORDER_ONLY 하나다
             * (findInterventionTargets 의 risk_type IN ('FIRST_ORDER_ONLY')).
             *
             * 나머지 7종을 여기서 뺀 이유 — 회의 결정(2026-07-24)과 담당 분리:
             *   CART_ABANDON       배너 노출이 의도된 설계로 확인, 발송 목록에서 제외
             *   BAD_EXPERIENCE     발송 전체 제외(사과 알림·쿠폰 모두), 수집 전용으로 전환
             *   SPENDING_DROP      과대 집계 문제로 발송 대상에서 제외
             *   WISHLIST_IDLE      찜 할인 알림(CHURN-13)이 담당 — 독촉 중복 방지
             *   MEMBERSHIP_CANCEL  실시간 만류 모달(FR-MSHIP-06)이 담당
             *   COUPON_EXPIRING    전용 메서드 runCouponExpiringInterventions()
             *   LOGIN_INACTIVE     전용 메서드 runLoginInactiveInterventions()
             *
             * 제외된 유형의 case 를 남겨두면 "이 유형에도 쿠폰이 나간다"고 읽혀
             * 회의 결정과 코드가 어긋나 보인다. 감지값은 대시보드·ML 피처로 계속 쓴다.
             */
            switch (target.getRiskType()) {
                case "FIRST_ORDER_ONLY" -> {
                    type = "COMEBACK";
                    refId = 4L; // 복귀 5000원 쿠폰 ID
                    // 이미 갖고 있으면 발급되지 않는다. 그때도 발급됐다고 알리면
                    // 고객은 쿠폰함에서 아무것도 찾지 못한다.
                    message = autoIssueCoupon(target.getUserId(), refId)
                            ? "돌아오신 것을 환영해요! 복귀 기념 특별 5,000원 할인 쿠폰이 발급되었습니다. 💖"
                            : "돌아오신 것을 환영해요! 받아두신 복귀 쿠폰이 아직 남아 있어요. 만료 전에 사용해 보세요. 💖";
                }
                default -> {
                    // 대상 조회가 FIRST_ORDER_ONLY 로 좁혀져 있어 여기 도달하지 않는다.
                    // 조회 조건이 넓어지면 이 분기가 살아나므로 안전한 기본값을 둔다.
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

        // 대조군은 "기록만 남기고 발송하지 않은 인원"이다. 상한에 걸려 기록조차 안 된 인원
        // (split.skipped())과 섞으면 대조군이 실제의 수십 배로 부풀려 보인다.
        return new InterventionRunResult(reqs.size(), toSend.size(), split.control());
    }

    @Transactional
    @Override
    public void runCouponExpiringInterventions() {
        runCouponExpiringInterventions(0);
    }

    @Transactional
    @Override
    public void runCouponExpiringInterventions(int limit) {
        List<ChurnScoreDTO> targets = capped(churnMapper.findTargetsByRiskTypes(List.of("COUPON_EXPIRING")), limit);
        if (targets.isEmpty()) {
            return;
        }

        // 다른 대응과 동일하게 경유한다. 이전에는 "운영성 안내"라는 이유로 100% 발송했는데,
        // 그러면 다른 실험에서 대조군으로 분류된 사람도 이 경로로 쿠폰 알림을 받아
        // "아무 처치도 받지 않은 대조군"이 성립하지 않는다(대조군 오염).
        List<InterventionRequest> reqs = new ArrayList<>();
        for (ChurnScoreDTO target : targets) {
            reqs.add(new InterventionRequest(
                    target.getUserId(),
                    target.getChurnScoreId(),
                    "COUPON_EXPIRING",
                    "PUSH",
                    "IN_APP"));
        }

        var split = interventionService.recordAndCheckControl(reqs);
        Set<Long> toSend = new HashSet<>(split.treatment());

        for (ChurnScoreDTO target : targets) {
            if (!toSend.contains(target.getUserId())) {
                continue; // 대조군·상한 제외분
            }
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
        runLoginInactiveInterventions(0);
    }

    @Transactional
    @Override
    public void runLoginInactiveInterventions(int limit) {
        List<ChurnScoreDTO> targets = capped(churnMapper.findTargetsByRiskTypes(List.of("LOGIN_INACTIVE")), limit);
        List<InterventionRequest> reqs = new ArrayList<>();
        for (ChurnScoreDTO target : targets) {
            reqs.add(new InterventionRequest(
                    target.getUserId(),
                    target.getChurnScoreId(),
                    "LOGIN_INACTIVE",
                    "PUSH",
                    "IN_APP"));
        }

        var split = interventionService.recordAndCheckControl(reqs);
        Set<Long> toSend = new HashSet<>(split.treatment());

        for (ChurnScoreDTO target : targets) {
            if (!toSend.contains(target.getUserId())) {
                continue;
            }
            // 복귀 5,000원 쿠폰 지급. 이미 갖고 있으면 발급되지 않으므로 문구를 나눈다.
            boolean issued = autoIssueCoupon(target.getUserId(), 4L);

            NotificationDTO noti = new NotificationDTO();
            noti.setUserId(target.getUserId());
            noti.setType("COMEBACK");
            noti.setMessage(issued
                    ? "오랜만에 뵙네요! 복귀 기념 특별 5,000원 할인 쿠폰이 발급되었습니다. 💖"
                    : "오랜만에 뵙네요! 받아두신 복귀 쿠폰이 아직 남아 있어요. 만료 전에 사용해 보세요. 💖");
            noti.setRefId(4L);
            noti.setIsRead(false);
            noti.setClicked(false);
            notificationMapper.insertNotification(noti);
        }
    }

    /**
     * 일 배치 전체 — 스케줄러와 관리자 수동 실행이 공유한다.
     * "매일 새벽에 도는 것과 같은 코드"임을 보장하려면 경로가 하나여야 한다.
     *
     * 순서에 이유가 있다: 발송은 감지 결과를 대상으로 하므로 뒤여야 하고,
     * 지표는 측정 결과를 반영해야 하므로 맨 마지막이다.
     */
    @Transactional
    @Override
    public BatchRunResult runDailyBatch(boolean forceSend) {
        runAllRules();
        int detected = churnMapper.countTodayRuleScores();
        int mlScored = runMlScoringQuietly();

        // 스케줄러는 스위치를 따르고(밤사이 임의 발송 방지), 관리자 수동 실행은 스위치를 무시한다
        // (사람이 대상 수를 확인하고 누른 것이므로 실행 의도가 분명하다).
        boolean willSend = forceSend || interventionEnabled;
        int sent = 0;
        int control = 0;
        if (willSend) {
            // 발송은 세 경로다(통합·쿠폰만료·미로그인복귀). 통합의 반환값만 쓰면
            // 나머지 둘이 누락된다 — 실측에서 2,754명이 나갔는데 14로 표시됐다.
            // 전용 메서드는 void 라, 실행 전후의 기록 수 차이로 실제 발송량을 센다.
            int before = churnMapper.countTodayInterventions();
            int beforeControl = churnMapper.countTodayControls();
            runInterventions();
            runCouponExpiringInterventions();
            runLoginInactiveInterventions();
            control = churnMapper.countTodayControls() - beforeControl;
            sent = (churnMapper.countTodayInterventions() - before) - control;
        }

        int measured = measureOutcomes();
        recordDailyMetric();
        return new BatchRunResult(detected, mlScored, willSend, sent, control, measured);
    }

    /** ML 서빙(:8000)이 꺼져 있어도 룰·대응·지표는 진행되어야 한다. */
    private int runMlScoringQuietly() {
        try {
            return churnMlService.runMlScoring();
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * 오늘 실행분 원복 — 대응 이력·측정·알림·발급 쿠폰을 되돌린다.
     * 발송 상한(1일 1건·유형별 7일 중복)이 걸려 재실행 시 대상이 0이 되므로,
     * 여러 사람이 시연·테스트하려면 이 경로가 필요하다.
     *
     * 감지(churn_score)는 지우지 않는다 — 배치를 다시 돌리면 어차피 재생성되고,
     * 위험 고객 화면이 빈 채로 남는 것을 막기 위해서다.
     */
    @Transactional
    @Override
    public BatchResetResult resetTodayBatch() {
        // 쿠폰 재고를 먼저 복구한다(삭제 후에는 몇 장이었는지 알 수 없다)
        int coupons = 0;
        for (java.util.Map<String, Object> row : churnMapper.countTodayIssuedCouponsByCoupon()) {
            Long couponId = ((Number) row.get("couponId")).longValue();
            int cnt = ((Number) row.get("cnt")).intValue();
            churnMapper.restoreCouponQuantity(couponId, cnt);
            coupons += cnt;
        }
        churnMapper.deleteTodayIssuedCoupons();

        int notifications = churnMapper.deleteTodayInterventionNotifications();
        int outcomes = churnMapper.deleteTodayOutcomes();
        int interventions = churnMapper.deleteTodayInterventions();
        recordDailyMetric();   // 지표도 되돌린 상태로 다시 집계
        return new BatchResetResult(interventions, outcomes, notifications, coupons);
    }

    /**
     * 대응 효과를 측정해 기록한다 (CHURN-08).
     * 전환은 창 안에 주문이 확인되면 즉시 확정하고, 미전환은 창(7일)이 끝나야 확정한다.
     * 대조군도 같은 기준으로 판정해야 처치군과 비교(순효과)가 성립한다.
     */
    @Override
    public int measureOutcomes() {
        return outcomeMapper.insertConvertedOutcomes() + outcomeMapper.insertNotConvertedOutcomes();
    }

    /**
     * 오늘자 일별 지표를 집계해 적재한다.
     * 대시보드 KPI·주간 추이가 이 테이블을 읽으므로, 배치가 매일 채워야 화면이 오늘을 가리킨다.
     * 같은 날 재실행하면 최신 집계로 덮어쓴다.
     */
    @Override
    public void recordDailyMetric() {
        // 전환 창(7일)보다 넉넉하게 최근 10일을 재집계한다.
        // 오늘 1행만 쓰면 며칠 뒤 발생한 전환이 어느 날짜 지표에도 반영되지 않는다.
        churnMetricMapper.upsertRecentMetrics(10);
    }
}
