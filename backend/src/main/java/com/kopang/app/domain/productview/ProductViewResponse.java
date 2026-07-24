package com.kopang.app.domain.productview;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductViewResponse {

    private Long productId;
    private String name;
    private Integer price;
    private Integer discountPrice;
    private String imageUrl;
    private LocalDateTime viewedAt;
}
