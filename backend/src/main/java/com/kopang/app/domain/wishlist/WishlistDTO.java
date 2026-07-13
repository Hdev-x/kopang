package com.kopang.app.domain.wishlist;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class WishlistDTO {
    private Long wishlistId;
    private Long userId;
    private Long productId;
    private LocalDateTime createdAt;
    
    // 조인할 상품 관련 필드 추가
    private String name;
    private int price;
    private String imageUrl;
    private Integer discountPrice;
}
