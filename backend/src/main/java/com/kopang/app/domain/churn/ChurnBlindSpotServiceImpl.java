package com.kopang.app.domain.churn;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kopang.app.domain.intervention.InterventionRequest;
import com.kopang.app.domain.intervention.InterventionService;
import com.kopang.app.domain.notification.NotificationDTO;
import com.kopang.app.domain.notification.NotificationMapper;
import com.kopang.app.domain.recommendation.RecommendationResponse;
import com.kopang.app.domain.recommendation.RecommendationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChurnBlindSpotServiceImpl implements ChurnBlindSpotService {

    private static final int MAX_LIMIT = 100;

    private final ChurnBlindSpotMapper churnBlindSpotMapper;
    private final RecommendationService recommendationService;
    private final InterventionService interventionService;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public ChurnBlindSpotResult run(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, MAX_LIMIT));
        List<ChurnBlindSpotTarget> targets = churnBlindSpotMapper.findTargets(safeLimit);
        if (targets.isEmpty()) {
            return new ChurnBlindSpotResult(0, 0);
        }

        List<InterventionRequest> requests = new ArrayList<>();
        Map<Long, Long> firstProductByUser = new HashMap<>();
        for (ChurnBlindSpotTarget target : targets) {
            List<RecommendationResponse> recommendations =
                    recommendationService.getRecommendations(target.getUserId());
            if (recommendations.isEmpty()) {
                continue;
            }
            firstProductByUser.put(
                    target.getUserId(), recommendations.getFirst().getProductId());
            requests.add(new InterventionRequest(
                    target.getUserId(),
                    target.getChurnScoreId(),
                    "ML_HIGH",
                    "RECOMMEND",
                    "IN_APP"));
        }
        if (requests.isEmpty()) {
            return new ChurnBlindSpotResult(targets.size(), 0);
        }

        Set<Long> treatmentUsers =
                new HashSet<>(interventionService.recordAndCheckControl(requests));
        for (Long userId : treatmentUsers) {
            NotificationDTO notification = new NotificationDTO();
            notification.setUserId(userId);
            notification.setType("RECOMMEND");
            notification.setMessage("회원님을 위한 추천 상품이 준비됐어요.");
            notification.setRefId(firstProductByUser.get(userId));
            notificationMapper.insertNotification(notification);
        }
        return new ChurnBlindSpotResult(targets.size(), treatmentUsers.size());
    }
}
