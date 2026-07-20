package com.kopang.app.domain.notification;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface NotificationMapper {

    // ===== 등록 =====

    // 알림 생성 (이탈 대응 발송 시 호출)
    void insertNotification(NotificationDTO notification);
}
