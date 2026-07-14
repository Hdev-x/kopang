package com.kopang.app.domain.cart;

import com.kopang.app.domain.user.UserService;
import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CartItemDTO>>> getCart(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        List<CartItemDTO> items = cartService.getCartItems(userId);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addToCart(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody CartRequestDTO request) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        cartService.addToCart(userId, request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> updateQuantity(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long cartItemId,
            @RequestParam("quantity") int quantity) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        try {
            cartService.updateQuantity(userId, cartItemId, quantity);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCartItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long cartItemId) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        try {
            cartService.deleteCartItem(userId, cartItemId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
