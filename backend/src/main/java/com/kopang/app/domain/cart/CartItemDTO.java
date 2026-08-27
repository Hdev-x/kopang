package com.kopang.app.domain.cart;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CartItemDTO {
    private Long itemId;      // cart_item_id -> itemId로 매핑
    private Long cartId;
    private Long productId;
    private int quantity;
    private LocalDateTime addedAt;

    // 조인을 통해 가져올 상품 정보
    private String name;
    private int price;             // 실구매 가격 (할인가 적용)
    private Integer originalPrice; // 원가 (정가)
    private Integer discountPrice; // 할인가
    private String imageUrl;
}
