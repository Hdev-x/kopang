package com.kopang.app.domain.notification;

import java.util.List;

public interface NotificationService {

    // 내 알림 목록 (최신순)
    List<NotificationDTO> getNotifications(Long userId);
}
