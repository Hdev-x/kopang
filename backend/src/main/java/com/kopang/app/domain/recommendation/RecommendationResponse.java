package com.kopang.app.domain.recommendation;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecommendationResponse {

    private Long recommendId;
    private Long productId;
    private Long categoryId;
    private String name;
    private Integer price;
    private Integer discountPrice;
    private String imageUrl;
    private Double score;
    private String reason;
}
