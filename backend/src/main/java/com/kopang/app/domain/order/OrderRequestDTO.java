package com.kopang.app.domain.order;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequestDTO {
    private int totalPrice;
    private int usedPoint;
    private Long userCouponId;
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        private Long productId;
        private int quantity;
        private int price;
    }
}
