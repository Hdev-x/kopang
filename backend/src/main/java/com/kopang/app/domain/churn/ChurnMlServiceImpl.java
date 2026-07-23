package com.kopang.app.domain.churn;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChurnMlServiceImpl implements ChurnMlService {

    private final ChurnMlMapper mlMapper;

    // FastAPI 주소 (application-dev.properties: ml.api.base-url=http://localhost:8000)
    @Value("${ml.api.base-url}")
    private String mlBaseUrl;

    @Override
    @Transactional
    public int runMlScoring() {
        // 1) 전체 회원 피처 조회 (학습과 동일 집계 SQL)
        List<ChurnFeatureDTO> features = mlMapper.selectFeatures();
        if (features.isEmpty()) {
            return 0;
        }

        // 2) FastAPI 요청 조립 (userId + snake_case 피처 맵)
        List<ChurnMlRequest.UserInput> users = features.stream()
                .map(f -> new ChurnMlRequest.UserInput(f.getUserId(), toFeatureMap(f)))
                .toList();
        ChurnMlRequest req = new ChurnMlRequest();
        req.setUsers(users);

        // 3) FastAPI /predict/churn 호출 (RestClient)
        ChurnMlResponse res = RestClient.create()
                .post()
                .uri(mlBaseUrl + "/predict/churn")
                .contentType(MediaType.APPLICATION_JSON)
                .body(req)
                .retrieve()
                .body(ChurnMlResponse.class);

        if (res == null || res.getResults() == null || res.getResults().isEmpty()) {
            return 0;
        }

        // 4) 멱등성(오늘자 ML 삭제) 후 예측 결과 저장
        mlMapper.deleteTodayMlScores();
        mlMapper.insertMlScores(res.getResults());
        return res.getResults().size();
    }

    /** ChurnFeatureDTO(자바 필드) → FastAPI가 기대하는 snake_case 피처 맵 */
    private Map<String, Object> toFeatureMap(ChurnFeatureDTO f) {
        Map<String, Object> m = new HashMap<>();
        m.put("is_member", f.getIsMember());
        m.put("membership_cancelled", f.getMembershipCancelled());
        m.put("tenure_days", f.getTenureDays());
        m.put("recency_days", f.getRecencyDays());
        m.put("day_since_last_order", f.getDaySinceLastOrder());
        m.put("order_count", f.getOrderCount());
        m.put("total_spend", f.getTotalSpend());
        m.put("cart_abandon_count", f.getCartAbandonCount());
        m.put("wishlist_idle_count", f.getWishlistIdleCount());
        m.put("coupon_unused_count", f.getCouponUnusedCount());
        m.put("bad_review_count", f.getBadReviewCount());
        m.put("cancel_count", f.getCancelCount());
        m.put("spending_drop_ratio", f.getSpendingDropRatio());
        m.put("satisfaction_score", f.getSatisfactionScore());
        return m;
    }
}
