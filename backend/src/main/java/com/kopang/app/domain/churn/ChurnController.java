package com.kopang.app.domain.churn;

import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;


@RestController
@RequiredArgsConstructor
public class ChurnController {

    private final ChurnScoreService churnScoreService;
    

    // [임시] 이탈 판정 배치 수동 실행 — 추후 스케줄러(CHURN-06)로 대체
    @PostMapping("/api/admin/churn/run")
    public void run() {
        churnScoreService.detectWishlistIdle();
        churnScoreService.detectCartAbandon();
        churnScoreService.detectLoginInactive();
        churnScoreService.detectFirstOrderOnly();
        churnScoreService.detectMembershipCancel();
        churnScoreService.detectCouponExpiring();
        churnScoreService.detectSpendingDrop();
        churnScoreService.detectBadExperience();
    }

}
