package com.kopang.app.domain.churn;

import lombok.AllArgsConstructor;
import lombok.Data;

// GET /api/churn/home-banners 응답 — 홈 배너 2개 노출 판단
@Data
@AllArgsConstructor
public class HomeBannerResponse {

    // 배너①: 장바구니 방치 리마인더 노출 여부
    private boolean cartAbandon;

    // 배너②: 재구매 배너에 띄울 상품 (대상 아니면 null → 배너 미노출)
    private HomeBannerRebuy rebuy;
}
