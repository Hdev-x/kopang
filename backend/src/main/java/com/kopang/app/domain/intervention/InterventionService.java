package com.kopang.app.domain.intervention;

import java.util.List;

public interface InterventionService {
    // 대상 리스트를 한 번에 기록(bulk) + 대조군 판정.
    // 반환 = 처치군(발송해야 할) userId 리스트. 호출자는 이 목록에 든 회원에게만 발송한다.
    List<Long> recordAndCheckControl(List<InterventionRequest> reqs);
}