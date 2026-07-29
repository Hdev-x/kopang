#!/usr/bin/env python3
"""
train_churn.py — 이탈 예측 모델 학습 (로지스틱 회귀 + 확률 보정)

입력:  ml/seed/user_profiles.csv   (유저 1행 = 피처 + churned 라벨)
출력:  ml/model/churn_model.pkl    (보정된 model + scaler + feature 순서)

핵심: class_weight='balanced' 로 이탈자를 잘 잡되(recall), CalibratedClassifierCV 로
확률을 실제에 맞게 보정한다 → score 가 진짜 "이탈 가능성"을 뜻하고 등급(HIGH/MID/LOW)이 의미를 가진다.

실행:  ml/.venv/bin/python ml/model/train_churn.py
       — 프로젝트 루트에서 실행한다(경로가 루트 기준).
"""
import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

CSV = "ml/seed/user_profiles.csv"
MODEL_OUT = "ml/model/churn_model.pkl"
DROP = ["user_id", "prefered_order_cat", "seed_group", "seed_type", "churned"]


def main():
    df = pd.read_csv(CSV)
    df["satisfaction_score"] = df["satisfaction_score"].fillna(3.0)

    y = df["churned"]
    X = df.drop(columns=DROP)
    features = list(X.columns)

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr)
    X_te_s = scaler.transform(X_te)

    # 해석용 base 모델: 피처 계수(영향력)를 뽑기 위해 따로 학습
    base = LogisticRegression(max_iter=1000, class_weight="balanced")
    base.fit(X_tr_s, y_tr)

    # 예측용 모델: balanced 로지스틱을 확률 보정(isotonic)으로 감쌈
    #  → recall(이탈 잡기)은 유지하고, 예측 확률을 실제 이탈률에 맞게 교정
    model = CalibratedClassifierCV(
        LogisticRegression(max_iter=1000, class_weight="balanced"),
        method="isotonic", cv=5,
    )
    model.fit(X_tr_s, y_tr)

    # 평가
    pred = model.predict(X_te_s)
    proba = model.predict_proba(X_te_s)[:, 1]
    print(f"정확도(accuracy): {accuracy_score(y_te, pred):.3f}")
    print(f"AUC            : {roc_auc_score(y_te, proba):.3f}")
    print("\n[분류 리포트]")
    print(classification_report(y_te, pred, target_names=["잔존(0)", "이탈(1)"], digits=3))
    print("[혼동 행렬] (행=실제, 열=예측)")
    print(confusion_matrix(y_te, pred))

    # 보정 후 등급 분포 미리보기 (임계 0.7/0.4) — HIGH가 정상 비율인지 확인
    hi = int((proba >= 0.7).sum())
    mid = int(((proba >= 0.4) & (proba < 0.7)).sum())
    lo = int((proba < 0.4).sum())
    print(f"\n[보정 후 등급 분포 예상] HIGH {hi} / MID {mid} / LOW {lo}  (test {len(proba)}명)")

    # 피처 영향력 (해석용 base 계수)
    print("\n[피처 영향력] 양수=이탈 위험↑ / 음수=이탈 방어")
    for name, coef in sorted(zip(features, base.coef_[0]), key=lambda t: -abs(t[1])):
        print(f"  {name:22s} {coef:+.3f}")

    joblib.dump({"model": model, "scaler": scaler, "features": features}, MODEL_OUT)
    print(f"\n모델 저장 완료: {MODEL_OUT}")


if __name__ == "__main__":
    main()
