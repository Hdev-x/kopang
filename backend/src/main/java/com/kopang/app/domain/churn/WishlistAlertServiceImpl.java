package com.kopang.app.domain.churn;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kopang.app.domain.notification.NotificationDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WishlistAlertServiceImpl implements WishlistAlertService {

    private final WishlistAlertMapper wishlistAlertMapper;

    @Override
    @Transactional
    public int sendDiscountAlerts(int limit) {
        List<WishlistAlertTarget> targets = wishlistAlertMapper.findDiscountedWishlistTargets(limit);
        if (targets.isEmpty()) {
            return 0; // 빈 리스트면 bulk insert의 빈 VALUES 방지로 스킵
        }

        // 대상마다 WISHLIST 알림 조립 (ref_id=상품 → 클릭 시 상품 이동)
        List<NotificationDTO> notifications = new ArrayList<>();
        for (WishlistAlertTarget t : targets) {
            NotificationDTO n = new NotificationDTO();
            n.setUserId(t.getUserId());
            n.setType("WISHLIST");
            n.setMessage("찜하신 '" + t.getProductName() + "'이(가) 지금 할인 중이에요");
            n.setRefId(t.getProductId());
            notifications.add(n);
        }

        wishlistAlertMapper.insertWishlistNotifications(notifications);
        return notifications.size();
    }
}
