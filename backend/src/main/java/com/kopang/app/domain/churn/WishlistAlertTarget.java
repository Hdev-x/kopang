package com.kopang.app.domain.churn;

import lombok.Data;

/** 가격인하 찜 알림 대상 1건 (wishlist + products 조인 결과) */
@Data
public class WishlistAlertTarget {
    private Long userId;
    private Long productId;    // 알림 ref_id(클릭 이동 대상)
    private String productName; // 메시지에 넣을 상품명
}
