package com.kopang.app.domain.wishlist;

import java.util.List;

public interface WishlistService {
    void addWishlist(Long userId, Long productId);
    void deleteWishlist(Long userId, Long productId);
    List<WishlistDTO> getWishlist(Long userId);
    boolean checkWishlist(Long userId, Long productId);
}
