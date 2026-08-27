package com.kopang.app.domain.churn;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChurnScheduler {

    private final ChurnScoreService churnScoreService;

    /**
     * 매일 새벽 배치 — 감지(CHURN-06) → 대응 발송(CHURN-07) → 효과 측정(CHURN-08) → 지표 적재.
     *
     * 실제 로직은 ChurnScoreService.runDailyBatch() 에 있다. 관리자 화면의 수동 실행도
     * 같은 메서드를 호출한다 — 시연에서 "매일 도는 것과 같은 코드"라고 말하려면
     * 경로가 하나여야 하기 때문이다.
     */
    @Scheduled(cron = "${churn.batch.cron}", zone = "Asia/Seoul")
    public void runDailyBatch() {
        // forceSend=false — 스위치가 꺼져 있으면 발송하지 않는다(밤사이 임의 발송 방지)
        BatchRunResult result = churnScoreService.runDailyBatch(false);
        log.info("[churn] 일 배치 완료 — {}", result);
    }
}
