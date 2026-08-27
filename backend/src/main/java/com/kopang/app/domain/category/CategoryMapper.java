package com.kopang.app.domain.category;

import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface CategoryMapper {
    List<CategoryDTO> findAll();
}
