package com.kopang.app.domain.review;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ReviewMapper {
    void insert(ReviewDTO dto);
    List<ReviewDTO> findByProductId(@Param("productId") Long productId);
    ReviewDTO findById(@Param("reviewId") Long reviewId);
    List<ReviewDTO> findByUserId(@Param("userId") Long userId);
    void update(ReviewDTO dto);
    void delete(@Param("reviewId") Long reviewId);
}
