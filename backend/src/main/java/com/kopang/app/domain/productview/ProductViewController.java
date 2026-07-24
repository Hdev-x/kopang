package com.kopang.app.domain.productview;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.domain.user.UserService;
import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/product-views")
@RequiredArgsConstructor
public class ProductViewController {

    private final ProductViewService productViewService;
    private final UserService userService;

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> record(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("productId") Long productId) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        productViewService.recordView(userId, productId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductViewResponse>>> recent(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(name = "limit", defaultValue = "20") int limit) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        return ResponseEntity.ok(
                ApiResponse.success(productViewService.getRecentViews(userId, limit)));
    }
}
