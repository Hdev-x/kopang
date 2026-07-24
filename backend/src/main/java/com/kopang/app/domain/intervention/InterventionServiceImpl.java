package com.kopang.app.domain.intervention;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import com.kopang.app.domain.churn.ChurnMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InterventionServiceImpl implements InterventionService {

    // 상호 배타 쿠폰 쌍: 하나라도 받으면 다른 쪽 영구 제외 (2026-07-24 결정)
    private static final Set<String> EXCLUSIVE_COUPON_TYPES =
            Set.of("FIRST_ORDER_ONLY", "LOGIN_INACTIVE");

    private final ChurnMapper churnMapper;

    @Override
    public List<Long> recordAndCheckControl(List<InterventionRequest> reqs) {
        List<InterventionDTO> logs = new ArrayList<>();      // bulk insert용 기록 (전원)
        List<Long> treatment = new ArrayList<>();            // 처치군 = 발송 대상 userId

        // 상한 필터 재료: 모든 실행 경로(통합·전용 메서드)에 일괄 적용되도록 경유에서 처리
        Set<Long> treatedToday = new HashSet<>(churnMapper.findTodayTreatedUserIds());
        Set<Long> exclusiveReceived = new HashSet<>(churnMapper.findWelcomeComebackTreatedUserIds());

        // 자바 루프: 상한 필터 → 판정 + DTO 조립
        for (InterventionRequest req : reqs) {
            Long userId = req.getUserId();

            // 상한①: 유저당 1일 실제 대응 1건 (모달은 실시간 확정 신호라 제외)
            boolean isModal = "MODAL".equals(req.getActionType());
            if (!isModal && treatedToday.contains(userId)) {
                continue; // 오늘 이미 대응받음 → 기록·발송 모두 생략
            }

            // 상한②: 웰컴백·복귀 상호 배타 — 둘 중 하나라도 받은 적 있으면 제외
            if (EXCLUSIVE_COUPON_TYPES.contains(req.getRiskType())
                    && exclusiveReceived.contains(userId)) {
                continue;
            }

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
                treatment.add(userId);       // 처치군만 발송 대상에 담음
                treatedToday.add(userId);    // 같은 실행 안의 중복 요청도 상한①에 걸리게
            }
        }

        // DB insert는 루프 밖에서 1번 (bulk). 대상 없으면 빈 IN () SQL 방지로 스킵.
        if (!logs.isEmpty()) {
            churnMapper.insertInterventions(logs);
        }

        return treatment; // 발송해야 할 처치군 userId 목록
    }
}