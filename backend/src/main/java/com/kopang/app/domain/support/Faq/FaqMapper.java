package com.kopang.app.domain.support.Faq;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FaqMapper {

    List<FaqDTO> findAll();

    int insert(FaqRequestDTO request);

    int update(
            @Param("id") Long id,
            @Param("request") FaqRequestDTO request);

    int deleteById(@Param("id") Long id);

}
