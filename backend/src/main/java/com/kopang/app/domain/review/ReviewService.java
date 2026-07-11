package com.kopang.app.domain.review;

import java.util.List;

public interface ReviewService {
    void addReview(Long userId, Long productId, double rating, String content, String imageUrl);
    List<ReviewDTO> getReviewsByProductId(Long productId);
}
