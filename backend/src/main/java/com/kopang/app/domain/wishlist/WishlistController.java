package com.kopang.app.domain.wishlist;

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
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WishlistDTO>>> getWishlist(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        List<WishlistDTO> list = wishlistService.getWishlist(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addWishlist(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Long> body) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long productId = body.get("productId");
        if (productId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("상품 ID가 유효하지 않습니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        wishlistService.addWishlist(userId, productId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> deleteWishlist(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("productId") Long productId) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        wishlistService.deleteWishlist(userId, productId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<ApiResponse<Boolean>> checkWishlist(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("productId") Long productId) {
        if (userDetails == null) {
            return ResponseEntity.ok(ApiResponse.success(false)); // 비로그인은 무조건 찜 안됨 상태
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        boolean isWished = wishlistService.checkWishlist(userId, productId);
        return ResponseEntity.ok(ApiResponse.success(isWished));
    }
}
