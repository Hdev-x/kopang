package com.kopang.app.domain.notification;

import java.util.List;

public interface NotificationService {
    List<NotificationDTO> getNotifications(String email);

    int getUnreadCount(String email);

    void readNotification(String email, Long notificationId);

    void clickNotification(String email, Long notificationId);

    void sendNotification(Long userId, String type, String message, Long refId);
}
