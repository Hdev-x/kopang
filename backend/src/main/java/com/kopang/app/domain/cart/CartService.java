package com.kopang.app.domain.cart;

import com.kopang.app.domain.product.ProductMapper;
import com.kopang.app.domain.product.ProductDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartMapper cartMapper;
    private final ProductMapper productMapper;

    private Long getOrCreateCartId(Long userId) {
        Long cartId = cartMapper.findCartIdByUserId(userId);
        if (cartId == null) {
            cartMapper.insertCart(userId);
            cartId = cartMapper.findCartIdByUserId(userId);
        }
        return cartId;
    }

    public List<CartItemDTO> getCartItems(Long userId) {
        Long cartId = cartMapper.findCartIdByUserId(userId);
        if (cartId == null) {
            return Collections.emptyList();
        }
        return cartMapper.findCartItemsByCartId(cartId);
    }

    @Transactional
    public void addToCart(Long userId, Long productId, int quantity) {
        ProductDTO product = productMapper.findById(productId);
        if (product == null) {
            throw new IllegalArgumentException("존재하지 않는 상품입니다.");
        }
        if (product.getStock() < quantity) {
            throw new IllegalArgumentException("재고가 부족합니다. 남은 재고: " + product.getStock());
        }

        Long cartId = getOrCreateCartId(userId);
        CartItemDTO existing = cartMapper.findCartItemByProduct(cartId, productId);
        if (existing != null) {
            int newQty = existing.getQuantity() + quantity;
            if (product.getStock() < newQty) {
                throw new IllegalArgumentException("재고가 부족합니다. 남은 재고: " + product.getStock());
            }
            cartMapper.updateCartItemQuantity(existing.getItemId(), newQty);
        } else {
            cartMapper.insertCartItem(cartId, productId, quantity);
        }
    }

    @Transactional
    public void updateQuantity(Long userId, Long cartItemId, int quantity) {
        CartItemDTO item = cartMapper.findCartItemById(cartItemId);
        if (item == null) {
            throw new IllegalArgumentException("장바구니 항목이 존재하지 않습니다.");
        }
        Long cartId = cartMapper.findCartIdByUserId(userId);
        if (item.getCartId() == null || !item.getCartId().equals(cartId)) {
            throw new IllegalArgumentException("해당 장바구니 항목에 대한 권한이 없습니다.");
        }
        ProductDTO product = productMapper.findById(item.getProductId());
        if (product.getStock() < quantity) {
            throw new IllegalArgumentException("재고가 부족합니다. 남은 재고: " + product.getStock());
        }
        cartMapper.updateCartItemQuantity(cartItemId, quantity);
    }

    @Transactional
    public void deleteCartItem(Long userId, Long cartItemId) {
        CartItemDTO item = cartMapper.findCartItemById(cartItemId);
        if (item == null) {
            throw new IllegalArgumentException("장바구니 항목이 존재하지 않습니다.");
        }
        Long cartId = cartMapper.findCartIdByUserId(userId);
        if (item.getCartId() == null || !item.getCartId().equals(cartId)) {
            throw new IllegalArgumentException("해당 장바구니 항목에 대한 권한이 없습니다.");
        }
        cartMapper.deleteCartItem(cartItemId);
    }
}
