#!/usr/bin/env python3
"""
serve.py — 이탈 예측 ML 서빙 (FastAPI)

학습한 churn_model.pkl 을 로드해 POST /predict/churn 으로 이탈 확률을 응답한다.
Spring 배치가 aggregate_profiles.sql 로 뽑은 피처를 보내면, 같은 scaler·피처순서로
예측해 { userId, score, riskLevel } 를 돌려준다. (학습=실전 정합성)

실행: ml/.venv/bin/uvicorn ml.model.serve:app --port 8000
      (또는 ml/.venv/bin/python -m uvicorn ml.model.serve:app --port 8000)
      — 프로젝트 루트에서 실행한다(경로가 루트 기준).
"""
import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel

# 모델 번들 로드 (학습 때 저장한 model + scaler + 피처 순서)
BUNDLE = joblib.load("ml/model/churn_model.pkl")
MODEL = BUNDLE["model"]
SCALER = BUNDLE["scaler"]
FEATURES = BUNDLE["features"]
MODEL_VERSION = "v1"

# 결측 시 기본값: 만족도만 중립 3.0(학습과 동일), 나머지는 0
DEFAULTS = {f: (3.0 if f == "satisfaction_score" else 0.0) for f in FEATURES}

app = FastAPI(title="Kopang Churn ML")


class UserInput(BaseModel):
    userId: int
    features: dict  # { 피처이름(snake_case): 값 } — aggregate_profiles.sql 컬럼과 동일


class PredictRequest(BaseModel):
    users: list[UserInput]


def risk_level(score: float) -> str:
    if score >= 0.7:
        return "HIGH"
    if score >= 0.4:
        return "MID"
    return "LOW"


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_VERSION, "features": FEATURES}


@app.post("/predict/churn")
def predict_churn(req: PredictRequest):
    if not req.users:
        return {"results": []}

    # 피처를 학습과 동일한 순서로 행렬 구성 (없는 값은 DEFAULTS)
    matrix = [
        [u.features.get(f, DEFAULTS[f]) if u.features.get(f) is not None else DEFAULTS[f] for f in FEATURES]
        for u in req.users
    ]
    scaled = SCALER.transform(np.array(matrix, dtype=float))
    probs = MODEL.predict_proba(scaled)[:, 1]  # 이탈 확률

    results = []
    for u, p in zip(req.users, probs):
        score = round(float(p), 4)
        results.append({
            "userId": u.userId,
            "score": score,
            "riskLevel": risk_level(score),
            "modelVersion": MODEL_VERSION,
        })
    return {"results": results}
