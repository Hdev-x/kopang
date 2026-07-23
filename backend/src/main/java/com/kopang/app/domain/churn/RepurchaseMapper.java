package com.kopang.app.domain.churn;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.kopang.app.domain.notification.NotificationDTO;

/**
 * 재구매 알림(CHURN-04) 매퍼.
 * 대상 = 회원 평균 주문간격의 1.5~2배가 지난(재구매 적기) 회원. orders 기반, churn_score와 무관.
 */
@Mapper
public interface RepurchaseMapper {

    /**
     * 재구매 알림 대상 user_id 목록.
     * 조건: 완료주문 2건+ / 마지막 주문 후 경과가 평균간격의 1.5~2배 / 최근 7일 REBUY 미발송.
     * @param limit 발송 상한 (검증 시 소량, 운영 시 크게)
     */
    List<Long> findRepurchaseTargets(@Param("limit") int limit);

    /** REBUY 알림 bulk insert */
    void insertRebuyNotifications(@Param("list") List<NotificationDTO> notifications);
}
