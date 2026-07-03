package com.kopang.app.domain.product;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ProductMapper {

    List<ProductDTO> findProducts(
        @Param("categoryId") Long categoryId,
        @Param("keyword") String keyword,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    long countProducts(
        @Param("categoryId") Long categoryId,
        @Param("keyword") String keyword
    );

    ProductDTO findById(@Param("productId") Long productId);
}
