package com.kopang.app.domain.intervention;

import org.springframework.stereotype.Service;
import com.kopang.app.domain.churn.ChurnMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InterventionServiceImpl implements InterventionService {

    private final ChurnMapper churnMapper;

    @Override
    public boolean recordAndCheckControl(InterventionRequest req) {
        // req에서 필요한 값 꺼내기
        Long userId = req.getUserId();
        Long churnScoreId = req.getChurnScoreId();
        String riskType = req.getRiskType();
        String actionType = req.getActionType();
        String channel = req.getChannel();

        boolean isControl = (userId % 5 == 0); // 대조군 판정 (userId % 5)

        InterventionDTO log = new InterventionDTO();
        log.setUserId(userId);
        log.setChurnScoreId(churnScoreId);
        log.setRiskType(riskType);
        log.setActionType(actionType);
        log.setIsControl(isControl);
        log.setChannel(channel);
        churnMapper.insertIntervention(log);

        return isControl; // 대조군 여부 돌려주기
    }
}