package com.kopang.app.domain.churn;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HomeBannerMapper {

    // 홈 배너①: 장바구니 방치 여부
    boolean existsCartAbandon(Long userId);

    // 홈 배너②: 재구매 적기면 가장 자주 산 상품 1개, 아니면 null
    HomeBannerRebuy findRebuyProduct(Long userId);
}
