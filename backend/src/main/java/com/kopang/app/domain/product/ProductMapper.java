package com.kopang.app.domain.product;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ProductMapper {

    List<ProductDTO> findProducts(
        @Param("categoryId") Long categoryId,
        @Param("keyword") String keyword,
        @Param("sort") String sort,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    long countProducts(
        @Param("categoryId") Long categoryId,
        @Param("keyword") String keyword
    );

    ProductDTO findById(@Param("productId") Long productId);

    void updateStock(@Param("productId") Long productId, @Param("stock") int stock);

    void insertProduct(ProductDTO product);

    void updateProduct(ProductDTO product);

    void deleteProduct(@Param("productId") Long productId);

    void insertProductImage(@Param("productId") int productId, @Param("url") String url);

    List<String> findImageUrlsByProductId(@Param("productId") int productId);

    void deleteProductImagesByProductId(@Param("productId") int productId);

    List<ProductDTO> findSimilarProducts(
        @Param("productId") Long productId,
        @Param("categoryId") Long categoryId,
        @Param("price") int price,
        @Param("limit") int limit
    );
}
