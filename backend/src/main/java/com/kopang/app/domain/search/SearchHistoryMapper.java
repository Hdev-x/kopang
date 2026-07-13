package com.kopang.app.domain.search;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface SearchHistoryMapper {
    void insert(SearchHistoryDTO dto);
    List<SearchHistoryDTO> findByUserId(@Param("userId") Long userId);
    void deleteById(@Param("searchId") Long searchId, @Param("userId") Long userId);
    void clearAllByUserId(@Param("userId") Long userId);
}
