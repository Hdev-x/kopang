package com.kopang.app.domain.review;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewMapper reviewMapper;

    @Override
    public void addReview(Long userId, Long productId, double rating, String content, String imageUrl) {
        ReviewDTO dto = new ReviewDTO();
        dto.setUserId(userId);
        dto.setProductId(productId);
        dto.setRating(rating);
        dto.setContent(content);
        dto.setImage(imageUrl);
        reviewMapper.insert(dto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDTO> getReviewsByProductId(Long productId) {
        return reviewMapper.findByProductId(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDTO> getReviewsByUserId(Long userId) {
        return reviewMapper.findByUserId(userId);
    }

    @Override
    public void updateReview(Long userId, Long reviewId, double rating, String content, String imageUrl) {
        ReviewDTO review = reviewMapper.findById(reviewId);
        if (review == null) {
            throw new IllegalArgumentException("존재하지 않는 리뷰입니다. ID: " + reviewId);
        }
        if (!review.getUserId().equals(userId)) {
            throw new IllegalStateException("리뷰를 수정할 권한이 없습니다.");
        }
        review.setRating(rating);
        review.setContent(content);
        review.setImage(imageUrl);
        reviewMapper.update(review);
    }

    @Override
    public void deleteReview(Long userId, Long reviewId) {
        ReviewDTO review = reviewMapper.findById(reviewId);
        if (review == null) {
            throw new IllegalArgumentException("존재하지 않는 리뷰입니다. ID: " + reviewId);
        }
        if (!review.getUserId().equals(userId)) {
            throw new IllegalStateException("리뷰를 삭제할 권한이 없습니다.");
        }
        reviewMapper.delete(reviewId);
    }
}
