package com.kopang.app.domain.review;

import com.kopang.app.domain.membership.MembershipMapper;
import com.kopang.app.domain.membership.UserMembershipDTO;
import com.kopang.app.domain.order.OrderDTO;
import com.kopang.app.domain.order.OrderMapper;
import com.kopang.app.domain.point.PointHistoryDTO;
import com.kopang.app.domain.point.PointMapper;

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
    private final PointMapper pointMapper;
    private final MembershipMapper membershipMapper;

    @Override
    public void addReview(Long userId, Long productId, double rating, String content, String imageUrl) {

        // 1. 해당 상품에 대해 사용자가 작성한 기존 리뷰 수
        List<ReviewDTO> existingReviews = reviewMapper.findByUserId(userId);
        long reviewCount = existingReviews.stream()
                .filter(r -> r.getProductId().equals(productId))
                .count();

        // 2. 해당 상품을 구매확정(CONFIRMED)한 총 구매 수량
        List<OrderDTO> orders = orderMapper.findOrdersByUserId(userId);
        long confirmedPurchaseCount = orders.stream()
                .filter(order -> "CONFIRMED".equals(order.getOrderStatus()))
                .flatMap(order -> order.getItems().stream())
                .filter(item -> item.getProductId().equals(productId))
                .mapToLong(item -> item.getQuantity() > 0 ? item.getQuantity() : 1L)
                .sum();

        if (confirmedPurchaseCount == 0) {
            throw new IllegalStateException("구매확정한 상품에 대해서만 리뷰를 작성할 수 있습니다.");
        }

        if (reviewCount >= confirmedPurchaseCount) {
            throw new IllegalStateException("이미 구매하신 횟수만큼 리뷰를 작성하셨습니다.");
        }

        ReviewDTO dto = new ReviewDTO();
        dto.setUserId(userId);
        dto.setProductId(productId);
        dto.setRating(rating);
        dto.setContent(content);
        dto.setImage(imageUrl);
        reviewMapper.insert(dto);

        // 리뷰 작성시 포인트 적립
        UserMembershipDTO activeMembership = membershipMapper.findActiveMembershipByUserId(userId);
        int points = 50;

        // 멤버십 회원에게는 3배 혜택인 150P 지급
        if (activeMembership != null && "ACTIVE".equals(activeMembership.getStatus())) {
            points = 150;
        }

        PointHistoryDTO history = new PointHistoryDTO();
        history.setUserId(userId);
        history.setAmount(points);
        history.setType("REVIEW");
        history.setDescription("리뷰 작성 보너스 포인트 적립 (상품 ID: " + productId + ")");
        pointMapper.insertPointHistory(history);
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
