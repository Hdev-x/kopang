package com.kopang.app.domain.review;

import com.kopang.app.domain.user.UserService;
import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products/{id}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReviewDTO>>> getReviews(
            @PathVariable("id") Long productId) {
        List<ReviewDTO> list = reviewService.getReviewsByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addReview(
            @PathVariable("id") Long productId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        
        double rating;
        try {
            rating = Double.parseDouble(String.valueOf(body.get("rating")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("평점이 올바르지 않습니다"));
        }
        
        String content = (String) body.get("content");
        String imageUrl = (String) body.get("imageUrl"); // 필요 시 연동

        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        reviewService.addReview(userId, productId, rating, content, imageUrl);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
