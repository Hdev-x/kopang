package com.kopang.app.domain.churn;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.domain.user.UserService;
import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;

import lombok.RequiredArgsConstructor;

// 홈 배너 노출 판단 — 일반 사용자용 (admin 아님)
@RestController
@RequestMapping("/api/churn/home-banners")
@RequiredArgsConstructor
public class HomeBannerController {

    private final HomeBannerService homeBannerService;
    private final UserService userService;

    // 로그인 사용자 본인의 배너 노출 여부 조회
    @GetMapping
    public ResponseEntity<ApiResponse<HomeBannerResponse>> getHomeBanners(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        return ResponseEntity.ok(ApiResponse.success(homeBannerService.getHomeBanners(userId)));
    }
}
