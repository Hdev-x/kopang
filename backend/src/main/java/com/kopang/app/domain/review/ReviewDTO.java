package com.kopang.app.domain.review;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReviewDTO {
    private Long reviewId;
    private Long userId;
    private String userName; // 조인해서 채울 회원 이름
    private Long productId;
    private double rating;
    private String content;
    private String image;
    private LocalDateTime createdAt;
}
