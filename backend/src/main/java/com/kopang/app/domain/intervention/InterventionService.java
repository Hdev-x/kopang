package com.kopang.app.domain.intervention;

public interface InterventionService {
    // 대응 1건 기록 + 대조군 판정. 반환 = 대조군이면 true (호출자는 false일 때만 발송)
    boolean recordAndCheckControl(InterventionRequest req);
}