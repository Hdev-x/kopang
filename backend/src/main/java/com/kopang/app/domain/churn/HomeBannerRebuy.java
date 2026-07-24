package com.kopang.app.domain.churn;

import lombok.Data;

// 재구매 배너에 띄울 상품 (Mapper 조회 결과)
@Data
public class HomeBannerRebuy {
    private Long productId;
    private String productName;
}
