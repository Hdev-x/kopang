package com.kopang.app.domain.churn;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ChurnScheduler {

    private final ChurnScoreService churnScoreService;

    @Scheduled(cron = "${churn.batch.cron}", zone = "Asia/Seoul")
    public void runDailyBatch() {
        churnScoreService.runAllRules();
    }


}
