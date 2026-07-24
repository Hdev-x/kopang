package com.kopang.app.domain.notification;

import com.kopang.app.domain.user.UserMapper;
import com.kopang.app.domain.user.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper notificationMapper;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotifications(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            return Collections.emptyList();
        }
        return notificationMapper.findByUserId(user.getUserId());
    }

    @Override
    @Transactional(readOnly = true)
    public int getUnreadCount(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            return 0;
        }
        return notificationMapper.countUnreadByUserId(user.getUserId());
    }

    @Override
    public void readNotification(String email, Long notificationId) {
        UserDTO user = userMapper.detailByEmail(email);
        NotificationDTO noti = notificationMapper.findById(notificationId);
        if (user == null || noti == null || !noti.getUserId().equals(user.getUserId())) {
            throw new IllegalArgumentException("권한이 없거나 존재하지 않는 알림입니다.");
        }
        notificationMapper.markAsRead(notificationId);
    }

    @Override
    public void clickNotification(String email, Long notificationId) {
        UserDTO user = userMapper.detailByEmail(email);
        NotificationDTO noti = notificationMapper.findById(notificationId);
        if (user == null || noti == null || !noti.getUserId().equals(user.getUserId())) {
            throw new IllegalArgumentException("권한이 없거나 존재하지 않는 알림입니다.");
        }
        notificationMapper.markAsClicked(notificationId);
    }

    @Override
    public void sendNotification(Long userId, String type, String message, Long refId) {
        NotificationDTO dto = NotificationDTO.builder()
                .userId(userId)
                .type(type)
                .message(message)
                .refId(refId)
                .isRead(false)
                .clicked(false)
                .build();
        notificationMapper.insert(dto);
    }
}
