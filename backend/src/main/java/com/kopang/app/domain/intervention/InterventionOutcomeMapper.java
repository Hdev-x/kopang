package com.kopang.app.domain.intervention;

import org.apache.ibatis.annotations.Mapper;

/**
 * 대응 효과 측정(intervention_outcome) 적재 매퍼 — CHURN-08.
 *
 * 대응을 보낸 뒤 "실제로 샀는가"를 판정해 기록한다. 대조군(is_control)도 똑같이 판정해야
 * 처치군과 비교할 수 있으므로, 발송 여부와 무관하게 모든 대응 이력이 측정 대상이다.
 *
 * 판정 시점이 둘로 나뉜다:
 *   - 전환은 발생 즉시 확정 가능하다 (창 안에 주문이 있으면 그것으로 끝)
 *   - 미전환은 창이 끝나야 확정된다 (아직 살 수 있으므로)
 * 그래서 INSERT가 두 개다. 창 안이면서 아직 안 산 건은 판정을 미루고 다음 배치에서 다시 본다.
 */
@Mapper
public interface InterventionOutcomeMapper {

    /** 전환 확정 — 대응 후 창 안에 결제 완료 주문이 있는 건. @return 기록한 행 수 */
    int insertConvertedOutcomes();

    /** 미전환 확정 — 창이 끝났는데 주문이 없는 건. @return 기록한 행 수 */
    int insertNotConvertedOutcomes();
}
