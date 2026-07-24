package com.kopang.app.domain.intervention;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import com.kopang.app.domain.churn.ChurnMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InterventionServiceImpl implements InterventionService {

    private final ChurnMapper churnMapper;

    @Override
    public List<Long> recordAndCheckControl(List<InterventionRequest> reqs) {
        List<InterventionDTO> logs = new ArrayList<>();      // bulk insert용 기록 (전원)
        List<Long> treatment = new ArrayList<>();            // 처치군 = 발송 대상 userId

        // 자바 루프: 판정 + DTO 조립 (DB 접근 없음, 비용 저렴)
        for (InterventionRequest req : reqs) {
            Long userId = req.getUserId();
            boolean isControl = (userId % 5 == 0); // 대조군 판정 (userId % 5)

            InterventionDTO log = new InterventionDTO();
            log.setUserId(userId);
            log.setChurnScoreId(req.getChurnScoreId());
            log.setRiskType(req.getRiskType());
            log.setActionType(req.getActionType());
            log.setIsControl(isControl);
            log.setChannel(req.getChannel());
            logs.add(log);

            if (!isControl) {
                treatment.add(userId); // 처치군만 발송 대상에 담음
            }
        }

        // DB insert는 루프 밖에서 1번 (bulk). 대상 없으면 빈 IN () SQL 방지로 스킵.
        if (!logs.isEmpty()) {
            churnMapper.insertInterventions(logs);
        }

        return treatment; // 발송해야 할 처치군 userId 목록
    }
}