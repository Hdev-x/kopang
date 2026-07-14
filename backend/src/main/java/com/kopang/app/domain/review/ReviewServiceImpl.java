package com.kopang.app.domain.review;

import com.kopang.app.domain.order.OrderDTO;
import com.kopang.app.domain.order.OrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewMapper reviewMapper;
    private final OrderMapper orderMapper;

    @Override
    public void addReview(Long userId, Long productId, double rating, String content, String imageUrl) {
        // 구매확정 상태인지 검증
        List<OrderDTO> orders = orderMapper.findOrdersByUserId(userId);
        boolean hasConfirmedPurchase = orders.stream()
                .filter(order -> "CONFIRMED".equals(order.getOrderStatus()))
                .flatMap(order -> order.getItems().stream())
                .anyMatch(item -> item.getProductId().equals(productId));

        if (!hasConfirmedPurchase) {
            throw new IllegalStateException("구매확정한 상품에 대해서만 리뷰를 작성할 수 있습니다.");
        }

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
