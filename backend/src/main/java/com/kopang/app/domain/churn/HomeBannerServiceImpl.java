package com.kopang.app.domain.churn;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HomeBannerServiceImpl implements HomeBannerService {

    private final HomeBannerMapper homeBannerMapper;

    // 홈 배너 노출 판단 — 접속한 사용자 1명 기준 (읽기 전용)
    @Override
    @Transactional(readOnly = true)
    public HomeBannerResponse getHomeBanners(Long userId) {
        boolean cartAbandon = homeBannerMapper.existsCartAbandon(userId);
        HomeBannerRebuy rebuy = homeBannerMapper.findRebuyProduct(userId);
        return new HomeBannerResponse(cartAbandon, rebuy);
    }
}
