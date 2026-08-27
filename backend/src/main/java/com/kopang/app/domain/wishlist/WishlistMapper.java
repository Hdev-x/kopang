package com.kopang.app.domain.wishlist;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface WishlistMapper {
    void insert(WishlistDTO dto);
    void delete(@Param("userId") Long userId, @Param("productId") Long productId);
    List<WishlistDTO> findByUserId(@Param("userId") Long userId);
    int exists(@Param("userId") Long userId, @Param("productId") Long productId);
}
