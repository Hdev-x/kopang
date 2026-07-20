package com.kopang.app.domain.churn;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;

import com.kopang.app.domain.intervention.InterventionDTO;
import com.kopang.app.domain.notification.NotificationDTO;

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

    // 재실행 대비 멱등성 확보
    void deleteTodayRuleScores();


    // ===== 대응 (intervention) =====

    // 오늘자 ④⑧ 발송 대상 (7일 내 중복 발송 제외)
    List<ChurnScoreDTO> findInterventionTargets();

    // 알림 발송 (처치군)
    void insertNotification(NotificationDTO notification);

    // 발송 기록 (대조군 포함 전원)
    void insertIntervention(InterventionDTO intervention);

}
