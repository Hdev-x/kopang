package com.kopang.app.domain.churn;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.kopang.app.domain.intervention.InterventionDTO;

@Mapper
public interface ChurnMapper {

    // ===== 조회 =====

    // 룰1) 장바구니 방치
    List<Long> findCartAbandonUsers();

    // 룰2) 멤버십 해지
    List<Long> findMembershipCancelUsers();

    // 룰3) 첫구매 후 미복귀 회원 목록
    List<Long> findFirstOrderOnlyUsers();

    // 룰4) 찜 7일 경과 + 해당 상품 미주문 회원 목록
    List<Long> findWishlistIdleUsers();

    // 룰5) 쿠폰 만료 임박 회원 목록
    List<Long> findCouponExpiringUsers();

    // 룰6) 부정경험 회원 목록
    List<Long> findBadExperienceUsers();

    // 룰7) 30일 미로그인 회원 목록
    List<Long> findLoginInactiveUsers();

    // 룰8) 최근 30일 지출 < 직전 30일의 50% 회원 목록
    List<Long> findSpendingDropUsers();

    // ===== 저장 =====

    // 이탈 점수 저장 (모든 룰 공통)
    void insertChurnScore(ChurnScoreDTO score);

    /**
     * 판정 결과 일괄 저장. 한 건씩 넣으면 회원 수만큼 DB 를 왕복한다
     * (원격 DB 기준 7,000건에 수 분). 룰 8종이 매번 전 회원을 판정하므로 차이가 크다.
     */
    void insertChurnScores(@Param("list") List<ChurnScoreDTO> scores);

    /**
     * 오늘 이미 판정이 남아 있는 회원 (유형별).
     * 삭제가 FK 때문에 남긴 행과 겹치는 것을 걸러 재실행 시 중복 누적을 막는다.
     */
    List<Long> findTodayScoredUserIds(@Param("riskType") String riskType);

    /** 대응 알림 일괄 저장 — 공용 NotificationMapper 를 건드리지 않으려고 여기에 둔다 */
    void insertChurnNotifications(@Param("list") List<com.kopang.app.domain.notification.NotificationDTO> list);

    /** 주어진 회원 중 해당 쿠폰을 이미 가진 사람 (한 명씩 조회하면 N 번 왕복한다) */
    List<Long> findUsersHavingCoupon(@Param("couponId") Long couponId, @Param("userIds") List<Long> userIds);

    /** 쿠폰 일괄 발급 (issued_by='CHURN') */
    void insertChurnUserCoupons(@Param("couponId") Long couponId,
                                @Param("expiresAt") java.util.Date expiresAt,
                                @Param("userIds") List<Long> userIds);

    /** 재고 일괄 차감 */
    int decreaseCouponQuantityBy(@Param("couponId") Long couponId, @Param("count") int count);

    // 재실행 대비 멱등성 확보
    void deleteTodayRuleScores();

    // ===== 대응 (intervention) =====

    // 오늘자 ④⑧ 발송 대상 (7일 내 중복 발송 제외)
    List<ChurnScoreDTO> findInterventionTargets();

    // 팀원 대응용: 지정한 risk_type들의 오늘자 발송 대상 (7일 내 중복 제외)
    List<ChurnScoreDTO> findTargetsByRiskTypes(@Param("riskTypes") List<String> riskTypes);

    // 특정 회원의 특정 위험 유형에 대한 최신 이탈 점수 조회
    ChurnScoreDTO findLatestScoreByUserIdAndRiskType(@Param("userId") Long userId, @Param("riskType") String riskType);

    // 알림 발송은 NotificationMapper로 분리 (NOTI-01)

    // 발송 기록 (대조군 포함 전원) — 대상 리스트를 한 번의 INSERT로 bulk 기록
    void insertInterventions(List<InterventionDTO> interventions);

    // 상한①: 오늘 이미 실제 대응(처치군)을 받은 회원 — 1일 1건 상한용
    List<Long> findTodayTreatedUserIds();

    // 상한②: 웰컴백·복귀 쿠폰을 받은 적 있는 회원 — 두 쿠폰 상호 배타용
    List<Long> findWelcomeComebackTreatedUserIds();

    // 특정 회원의 특정 위험/대응/일수 내 기록이 존재하는지 카운트
    int countRecentIntervention(@Param("userId") Long userId, @Param("riskType") String riskType,
            @Param("actionType") String actionType, @Param("days") int days);

    // 이미 기록된 대응의 대조군 여부 (프론트 응답과 DB 값을 일치시키기 위해 조회)
    boolean isControlRecorded(@Param("userId") Long userId, @Param("riskType") String riskType,
            @Param("actionType") String actionType);

    // 오늘 감지된 룰 판정 수 (배치 실행 결과 표시용)
    int countTodayRuleScores();

    // 발송량 집계용 — 전용 발송 메서드가 void 라 실행 전후 차이로 센다
    int countTodayInterventions();

    int countTodayControls();

    // ===== 오늘 배치 실행분 원복 (시연·테스트 재실행용) =====
    /** 이탈 대응이 발급하는 쿠폰. 공용 CouponMapper 대신 여기서 넣는 이유는 issued_by 를 남기기 위해서다. */
    int insertChurnUserCoupon(@Param("userId") Long userId,
                              @Param("couponId") Long couponId,
                              @Param("expiresAt") java.util.Date expiresAt);

    List<java.util.Map<String, Object>> countTodayIssuedCouponsByCoupon();

    int deleteTodayIssuedCoupons();

    int restoreCouponQuantity(@Param("couponId") Long couponId, @Param("cnt") int cnt);

    int deleteTodayInterventionNotifications();

    int deleteTodayOutcomes();

    int deleteTodayInterventions();

}
