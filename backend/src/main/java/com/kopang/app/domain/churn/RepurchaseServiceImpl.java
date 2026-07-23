package com.kopang.app.domain.churn;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kopang.app.domain.notification.NotificationDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RepurchaseServiceImpl implements RepurchaseService {

    private final RepurchaseMapper repurchaseMapper;

    private static final String REBUY_MESSAGE = "자주 구매하신 상품, 다시 채우실 때가 되었어요";

    @Override
    @Transactional
    public int sendRepurchaseAlerts(int limit) {
        List<Long> targets = repurchaseMapper.findRepurchaseTargets(limit);
        if (targets.isEmpty()) {
            return 0; // 빈 리스트면 bulk insert의 빈 VALUES SQL 방지로 스킵
        }

        // 대상마다 REBUY 알림 DTO 조립 (ref_id는 특정 상품 미지정 → null)
        List<NotificationDTO> notifications = new ArrayList<>();
        for (Long userId : targets) {
            NotificationDTO n = new NotificationDTO();
            n.setUserId(userId);
            n.setType("REBUY");
            n.setMessage(REBUY_MESSAGE);
            notifications.add(n);
        }

        repurchaseMapper.insertRebuyNotifications(notifications);
        return notifications.size();
    }
}
