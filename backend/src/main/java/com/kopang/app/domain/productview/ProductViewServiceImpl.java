package com.kopang.app.domain.productview;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductViewServiceImpl implements ProductViewService {

    private static final int MAX_LIMIT = 20;

    private final ProductViewMapper productViewMapper;

    @Override
    @Transactional
    public void recordView(Long userId, Long productId) {
        productViewMapper.insertView(userId, productId);
    }

    @Override
    public List<ProductViewResponse> getRecentViews(Long userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, MAX_LIMIT));
        return productViewMapper.findRecentViews(userId, safeLimit);
    }
}
