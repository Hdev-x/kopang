package com.kopang.app.domain.wishlist;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistServiceImpl implements WishlistService {

    private final WishlistMapper wishlistMapper;

    @Override
    public void addWishlist(Long userId, Long productId) {
        WishlistDTO dto = new WishlistDTO();
        dto.setUserId(userId);
        dto.setProductId(productId);
        wishlistMapper.insert(dto);
    }

    @Override
    public void deleteWishlist(Long userId, Long productId) {
        wishlistMapper.delete(userId, productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WishlistDTO> getWishlist(Long userId) {
        return wishlistMapper.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkWishlist(Long userId, Long productId) {
        return wishlistMapper.exists(userId, productId) > 0;
    }
}
