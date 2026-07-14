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
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class MyReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    // 1. 내 리뷰 리스트 조회
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ReviewDTO>>> getMyReviews(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        List<ReviewDTO> list = reviewService.getReviewsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // 2. 리뷰 수정
    @PutMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> updateReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("reviewId") Long reviewId,
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
        String imageUrl = (String) body.get("imageUrl");

        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        try {
            reviewService.updateReview(userId, reviewId, rating, content, imageUrl);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 3. 리뷰 삭제
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("reviewId") Long reviewId) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        try {
            reviewService.deleteReview(userId, reviewId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
