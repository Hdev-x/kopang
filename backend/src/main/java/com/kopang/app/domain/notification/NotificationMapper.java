package com.kopang.app.domain.notification;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NotificationMapper {

    // ===== 등록 =====

    // 알림 생성 (이탈 대응 발송 시 호출)
    void insertNotification(NotificationDTO notification);

    // ===== 조회 =====

    // 내 알림 목록 (최신순)
    List<NotificationDTO> findByUserId(Long userId);

    // ===== 수정 =====

    // 읽음 처리. user_id 조건 필수 — 남의 알림 못 건드리게. 반환=영향 행수(0이면 없거나 남의 것)
    int markAsRead(@Param("notificationId") Long notificationId, @Param("userId") Long userId);
}
