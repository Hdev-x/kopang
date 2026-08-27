package com.kopang.app.domain.intervention;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
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
    public RecordResult recordAndCheckControl(List<InterventionRequest> reqs) {
        List<InterventionDTO> logs = new ArrayList<>();      // bulk insert용 기록 (전원)
        List<Long> treatment = new ArrayList<>();            // 처치군 = 발송 대상 userId
        int control = 0;                                     // 대조군 = 기록만, 발송 안 함
        int skipped = 0;                                     // 상한에 걸려 기록조차 안 한 인원

        // 상한 필터 재료: 모든 실행 경로(통합·전용 메서드)에 일괄 적용되도록 경유에서 처리
        Set<Long> treatedToday = new HashSet<>(churnMapper.findTodayTreatedUserIds());
        Set<Long> exclusiveReceived = new HashSet<>(churnMapper.findWelcomeComebackTreatedUserIds());

        // 자바 루프: 상한 필터 → 판정 + DTO 조립
        for (InterventionRequest req : reqs) {
            Long userId = req.getUserId();

            // 상한①: 유저당 1일 실제 대응 1건 (모달은 실시간 확정 신호라 제외)
            boolean isModal = "MODAL".equals(req.getActionType());
            if (!isModal && treatedToday.contains(userId)) {
                skipped++;
                continue; // 오늘 이미 대응받음 → 기록·발송 모두 생략
            }

            // 상한②: 웰컴백·복귀 상호 배타 — 둘 중 하나라도 받은 적 있으면 제외
            if (EXCLUSIVE_COUPON_TYPES.contains(req.getRiskType())
                    && exclusiveReceived.contains(userId)) {
                skipped++;
                continue;
            }

            boolean isControl = isControlFor(userId, req.getRiskType());

            InterventionDTO log = new InterventionDTO();
            log.setUserId(userId);
            log.setChurnScoreId(req.getChurnScoreId());
            log.setRiskType(req.getRiskType());
            log.setActionType(req.getActionType());
            log.setIsControl(isControl);
            log.setChannel(req.getChannel());
            logs.add(log);

            // 상한은 처치군·대조군 **양쪽에** 적용한다.
            // 처치군만 걸면 대조군은 같은 유저가 매일 무제한 기록되어, 시간이 갈수록
            // 두 군의 모집단 구성이 달라지고 전환율 비교가 편향된다.
            // 대조군을 여기 넣는 것은 오염 방지도 겸한다 — 오늘 대조군으로 잡힌 사람은
            // 다른 유형의 처치도 받지 않아야 "대응받지 않은 군"이 성립한다.
            treatedToday.add(userId);
            if (isControl) {
                control++;
            } else {
                treatment.add(userId);       // 처치군만 발송 대상에 담음
            }
        }

        // DB insert는 루프 밖에서 1번 (bulk). 대상 없으면 빈 IN () SQL 방지로 스킵.
        if (!logs.isEmpty()) {
            churnMapper.insertInterventions(logs);
        }

        return new RecordResult(treatment, control, skipped);
    }

    /**
     * 대조군 배정 — 위험 유형별로 독립된 해시 버킷 (20%).
     *
     * 왜 유저 고정인가: A/B 테스트의 표준(sticky bucketing)이다. 같은 사람이 처치군과
     * 대조군을 오가면 경험이 섞여 측정이 오염된다. 같은 유형 안에서는 항상 같은 군에 속한다.
     *
     * 왜 user_id % 5 가 아닌가: user_id 는 순차 발급이라 5의 배수가 특정 가입 시기와
     * 겹칠 수 있고(코호트 편향), 무엇보다 **모든 유형에서 같은 사람이 평생 대조군**이 된다.
     * 유형을 해시에 섞으면 유형별로 다른 대조군이 뽑혀 실험이 서로 독립된다.
     *
     * 해시는 결정적이다 — Long·String 의 hashCode 는 명세에 고정되어 있어 재실행해도 같다.
     */
    private static boolean isControlFor(Long userId, String riskType) {
        return Math.floorMod(Objects.hash(userId, riskType), 5) == 0;
    }
}