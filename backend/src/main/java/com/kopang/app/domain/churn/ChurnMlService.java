package com.kopang.app.domain.churn;

/** ML 이탈 예측 배치 서비스 (CHURN-02/06 ML 확장) */
public interface ChurnMlService {

    /**
     * ML 스코어링 배치: 피처 조회 → FastAPI 예측 → churn_score(source='ML') 저장.
     * @return 저장한 점수 수
     */
    int runMlScoring();
}
