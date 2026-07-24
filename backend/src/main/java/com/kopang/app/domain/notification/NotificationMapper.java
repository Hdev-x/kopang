package com.kopang.app.domain.notification;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface NotificationMapper {
    List<NotificationDTO> findByUserId(@Param("userId") Long userId);

    int countUnreadByUserId(@Param("userId") Long userId);

    void insert(NotificationDTO dto);

    void insertNotification(NotificationDTO dto);

    void markAsRead(@Param("notificationId") Long notificationId);

    void markAsClicked(@Param("notificationId") Long notificationId);

    NotificationDTO findById(@Param("notificationId") Long notificationId);
}
