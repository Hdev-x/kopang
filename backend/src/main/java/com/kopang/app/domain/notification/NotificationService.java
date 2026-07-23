package com.kopang.app.domain.notification;

import java.util.List;

public interface NotificationService {

    // 내 알림 목록 (최신순)
    List<NotificationDTO> getNotifications(Long userId);

    // 읽음 처리 (본인 알림만). 성공(1건 갱신)이면 true, 없거나 남의 것이면 false
    boolean markAsRead(Long notificationId, Long userId);
}
