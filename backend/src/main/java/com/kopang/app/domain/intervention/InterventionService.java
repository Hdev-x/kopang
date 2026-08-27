package com.kopang.app.domain.intervention;

import java.util.List;

public interface InterventionService {

    /**
     * 기록 결과. 셋을 구분해야 화면·리포트가 정확해진다.
     *
     * @param treatment 처치군 userId — 호출자는 이 목록에만 발송한다
     * @param control   대조군 수 — 일부러 발송하지 않고 기록만 남긴 인원
     * @param skipped   상한(1일 1건·상호 배타)에 걸려 기록조차 하지 않은 인원
     *
     * 이전에는 "요청 수 - 발송 수"를 대조군으로 표시했는데, 그 값에는 상한 제외분이
     * 섞여 있어 대조군이 실제의 수십 배로 부풀려 보였다.
     */
    record RecordResult(List<Long> treatment, int control, int skipped) {
        public int recorded() {
            return treatment.size() + control;
        }
    }

    // 대상 리스트를 한 번에 기록(bulk) + 대조군 판정.
    RecordResult recordAndCheckControl(List<InterventionRequest> reqs);
}
