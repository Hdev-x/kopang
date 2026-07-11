package com.kopang.app.domain.review;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ReviewMapper {
    void insert(ReviewDTO dto);
    List<ReviewDTO> findByProductId(@Param("productId") Long productId);
}
