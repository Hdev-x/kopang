package com.kopang.app.domain.recommendation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.domain.user.UserService;
import com.kopang.app.domain.user.UserDTO;
import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<RecommendationListResponse>> recommendations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        UserDTO user = userService.detailByEmail(userDetails.getEmail());
        Long userId = user.getUserId();
        RecommendationListResponse response = new RecommendationListResponse(
                user.getName() + "님을 위한 추천 상품",
                recommendationService.getRecommendations(userId));
        return ResponseEntity.ok(
                ApiResponse.success(response));
    }

    @PostMapping("/{id}/shown")
    public ResponseEntity<ApiResponse<Void>> markShown(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long recommendId) {
        Long userId = authenticatedUserId(userDetails);
        recommendationService.markShown(recommendId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/click")
    public ResponseEntity<ApiResponse<Void>> markClicked(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long recommendId) {
        Long userId = authenticatedUserId(userDetails);
        recommendationService.markClicked(recommendId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private Long authenticatedUserId(CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("인증되지 않은 사용자입니다");
        }
        return userService.detailByEmail(userDetails.getEmail()).getUserId();
    }
}
