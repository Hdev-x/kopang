package com.kopang.app.domain.notification;

import java.time.LocalDateTime;

import lombok.Data;

/** 알림 1건. notifications 테이블 1행에 대응 */
@Data
public class NotificationDTO {

    private Long notificationId;     // PK
    private Long userId;             // 받는 회원
    private String type;             // 알림 종류 (아래 enum 참고)
    private String message;          // 문구
    private Long refId;              // 액션 대상(상품 등) id, nullable
    private Boolean isRead;          // 읽음 여부
    private Boolean clicked;         // 클릭 여부 (대응 반응 추적)
    private LocalDateTime createdAt; // 생성 시각

    /*
     * type enum (notifications.type)
     *   ABANDON       장바구니 방치
     *   REBUY         재구매 유도        ← ⑧ 구매액 감소
     *   WISHLIST      찜 상품 알림       ← ④ 찜 방치
     *   COUPON_EXPIRE 쿠폰 만료 임박
     *   WELCOME_BACK  첫구매 후 복귀 유도
     *   APOLOGY       부정경험 사과
     *   COMEBACK      장기 미접속 복귀
     *   RECOMMEND     맞춤 추천
     *   NOTICE        공지
     */

}