package com.kopang.app.domain.notification;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper notificationMapper;

    // 내 알림 목록 (최신순)
    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotifications(Long userId) {
        return notificationMapper.findByUserId(userId);
    }

    // 읽음 처리 (본인 알림만). 영향 행수 > 0 이면 성공
    @Override
    @Transactional
    public boolean markAsRead(Long notificationId, Long userId) {
        return notificationMapper.markAsRead(notificationId, userId) > 0;
    }
}
