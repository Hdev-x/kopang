package com.kopang.app.domain.productview;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ProductViewMapper {

    int insertView(
            @Param("userId") Long userId,
            @Param("productId") Long productId);

    List<ProductViewResponse> findRecentViews(
            @Param("userId") Long userId,
            @Param("limit") int limit);
}
