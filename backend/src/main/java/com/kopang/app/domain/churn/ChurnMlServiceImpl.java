package com.kopang.app.domain.churn;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
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

    /**
     * 독립 트랜잭션으로 분리한다(REQUIRES_NEW).
     *
     * 일 배치(runDailyBatch)도 @Transactional 이라 기본 REQUIRED 로 두면 같은 트랜잭션에 합류한다.
     * 그 상태에서 FastAPI 호출이 실패하면 공유 트랜잭션이 rollback-only 로 표시되고,
     * 호출부(runMlScoringQuietly)가 예외를 잡아도 그 표시는 지워지지 않아
     * 커밋 시점에 감지·발송·측정·지표까지 전부 롤백된다(2026-07-30 실제 발생).
     * 분리해 두면 ML 실패는 ML 저장분만 되돌리고 배치는 룰 기반으로 계속 진행한다.
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
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
