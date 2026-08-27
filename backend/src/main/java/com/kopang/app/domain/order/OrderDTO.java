package com.kopang.app.domain.order;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderDTO {
    private Long orderId;
    private Long userId;
    private String userName;
    private int totalPrice;
    private String paymentStatus;
    private String paymentKey;
    private String orderStatus;
    private LocalDateTime createdAt;
    private int usedPoint;
    private Long userCouponId;

    private List<OrderItemDTO> items;
}
