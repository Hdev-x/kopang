package com.kopang.app.domain.churn;

import lombok.Data;

/**
 * ML 이탈 예측 입력 피처 (회원 1명). aggregate_profiles.sql 의 컬럼 = 학습 CSV 컬럼과 동일.
 * "학습 = 실전" 정합성: 이 14개 피처 이름·순서가 churn_model.pkl 의 features 와 맞아야 한다.
 */
@Data
public class ChurnFeatureDTO {

    private Long userId;
    private Integer isMember;            // 멤버십 여부 0/1
    private Integer membershipCancelled; // 멤버십 해지 이력 0/1
    private Integer tenureDays;          // 가입 후 경과일
    private Integer recencyDays;         // 마지막 로그인 후 경과일 (⑦)
    private Integer daySinceLastOrder;   // 마지막 주문 후 경과일
    private Integer orderCount;          // 주문 수 (③)
    private Long totalSpend;             // 총 구매액
    private Integer cartAbandonCount;    // 장바구니 방치 (①)
    private Integer wishlistIdleCount;   // 찜 방치 (④)
    private Integer couponUnusedCount;   // 미사용 쿠폰 (⑤)
    private Integer badReviewCount;      // 저평점 리뷰 (⑥)
    private Integer cancelCount;         // 취소·반품 (⑥)
    private Double spendingDropRatio;    // 최근/직전 지출 비율 (⑧)
    private Double satisfactionScore;    // 만족도 1~5, null=미응답(서빙에서 3.0 대체)
}
