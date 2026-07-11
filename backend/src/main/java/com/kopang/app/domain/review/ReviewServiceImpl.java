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
}
