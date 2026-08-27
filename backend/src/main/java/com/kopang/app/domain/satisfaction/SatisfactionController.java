package com.kopang.app.domain.satisfaction;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.domain.user.UserService;
import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class SatisfactionController {

    private final SatisfactionService satisfactionService;
    private final UserService userService;

    // 만족도 제출 (CHURN-17). 로그인 사용자 본인 기준.
    @PostMapping("/api/satisfaction")
    public ResponseEntity<ApiResponse<Void>> submit(
            @RequestBody SatisfactionRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        satisfactionService.submit(userId, req);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // 조사 노출 가능 여부 (3개월 1회). 비로그인은 노출 안 함(false)
    @GetMapping("/api/satisfaction/eligibility")
    public ResponseEntity<ApiResponse<Boolean>> eligibility(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(ApiResponse.success(false));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        return ResponseEntity.ok(ApiResponse.success(satisfactionService.isEligible(userId)));
    }
}
