package com.kopang.app.domain.churn;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.kopang.app.domain.notification.NotificationDTO;

/**
 * 찜 상품 가격인하 알림(CHURN-13) 매퍼.
 * 대상 = 찜한 상품이 현재 할인 중(discount_price < price)인 회원. products는 읽기만(상품 도메인 미수정).
 * 재입고 알림은 재고/가격 이력 인프라가 없어 이번 범위 제외.
 */
@Mapper
public interface WishlistAlertMapper {

    /** 가격인하 찜 알림 대상 (최근 7일 동일 상품 WISHLIST 미발송, limit 상한) */
    List<WishlistAlertTarget> findDiscountedWishlistTargets(@Param("limit") int limit);

    /** WISHLIST 알림 bulk insert */
    void insertWishlistNotifications(@Param("list") List<NotificationDTO> notifications);
}
