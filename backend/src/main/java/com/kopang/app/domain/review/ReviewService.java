package com.kopang.app.domain.review;

import java.util.List;

public interface ReviewService {
    void addReview(Long userId, Long productId, double rating, String content, String imageUrl);
    List<ReviewDTO> getReviewsByProductId(Long productId);
    List<ReviewDTO> getReviewsByUserId(Long userId);
    void updateReview(Long userId, Long reviewId, double rating, String content, String imageUrl);
    void deleteReview(Long userId, Long reviewId);
}
