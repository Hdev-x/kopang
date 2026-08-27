package com.kopang.app.domain.search;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SearchHistoryServiceImpl implements SearchHistoryService {

    private final SearchHistoryMapper searchHistoryMapper;

    @Override
    public void addSearchHistory(Long userId, String keyword) {
        // 이미 동일한 키워드가 있으면 삭제 후 재등록하여 최신화
        List<SearchHistoryDTO> list = searchHistoryMapper.findByUserId(userId);
        for (SearchHistoryDTO h : list) {
            if (h.getKeyword().equals(keyword)) {
                searchHistoryMapper.deleteById(h.getSearchId(), userId);
            }
        }
        SearchHistoryDTO dto = new SearchHistoryDTO();
        dto.setUserId(userId);
        dto.setKeyword(keyword);
        searchHistoryMapper.insert(dto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SearchHistoryDTO> getSearchHistory(Long userId) {
        return searchHistoryMapper.findByUserId(userId);
    }

    @Override
    public void deleteSearchHistory(Long searchId, Long userId) {
        searchHistoryMapper.deleteById(searchId, userId);
    }

    @Override
    public void clearSearchHistory(Long userId) {
        searchHistoryMapper.clearAllByUserId(userId);
    }
}
