package com.kopang.app.domain.order;

import lombok.Data;

@Data
public class OrderItemDTO {
    private Long orderItemId;
    private Long orderId;
    private Long productId;
    private int quantity;
    private int price;
    
    // 조인할 상품 정보
    private String name;
    private String imageUrl;
}
