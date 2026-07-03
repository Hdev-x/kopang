package com.kopang.app.domain.order;

import lombok.Data;

@Data
public class ConfirmRequestDTO {
    private String paymentKey;
    private String orderId;
    private int amount;
}
