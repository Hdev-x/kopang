package com.kopang.app.domain.cart;

import com.kopang.app.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private static final Long DEFAULT_USER_ID = 1L; // 로그인 구현 전이므로 홍길동 유저(1번)로 고정

    @GetMapping
    public ApiResponse<List<CartItemDTO>> getCart() {
        List<CartItemDTO> items = cartService.getCartItems(DEFAULT_USER_ID);
        return ApiResponse.success(items);
    }

    @PostMapping
    public ApiResponse<Void> addToCart(@RequestBody CartRequestDTO request) {
        cartService.addToCart(DEFAULT_USER_ID, request.getProductId(), request.getQuantity());
        return ApiResponse.success(null);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateQuantity(
            @PathVariable("id") Long cartItemId,
            @RequestParam("quantity") int quantity) {
        cartService.updateQuantity(cartItemId, quantity);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCartItem(@PathVariable("id") Long cartItemId) {
        cartService.deleteCartItem(cartItemId);
        return ApiResponse.success(null);
    }
}
