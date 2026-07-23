package com.kopang.app.domain.churn;

/** 재구매 알림 발송 서비스 (CHURN-04) */
public interface RepurchaseService {

    /**
     * 재구매 적기 회원에게 REBUY 알림 발송.
     * @param limit 발송 상한 (검증 시 소량)
     * @return 실제 발송 건수
     */
    int sendRepurchaseAlerts(int limit);
}
