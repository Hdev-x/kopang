package com.kopang.app.domain.productview;

import java.util.List;

public interface ProductViewService {

    void recordView(Long userId, Long productId);

    List<ProductViewResponse> getRecentViews(Long userId, int limit);
}
