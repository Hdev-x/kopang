package com.kopang.app.domain.cart;

import lombok.Data;

@Data
public class CartRequestDTO {
    private Long productId;
    private int quantity;
}
