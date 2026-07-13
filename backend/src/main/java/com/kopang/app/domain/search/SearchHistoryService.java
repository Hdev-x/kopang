package com.kopang.app.domain.search;

import java.util.List;

public interface SearchHistoryService {
    void addSearchHistory(Long userId, String keyword);
    List<SearchHistoryDTO> getSearchHistory(Long userId);
    void deleteSearchHistory(Long searchId, Long userId);
    void clearSearchHistory(Long userId);
}
