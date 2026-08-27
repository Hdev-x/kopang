# ml/ — 데이터 생성 · 시드 · 집계

> 근거 문서: [`docs/_/시드_시나리오.md`](../docs/_/시드_시나리오.md) · [`docs/_/DB_스키마_DDL.md`](../docs/_/DB_스키마_DDL.md)

## 폴더 구성

역할별로 `seed/`(데이터 만들기) · `model/`(학습·서빙) · `demo/`(발표용 준비)로 나눈다.
**모든 스크립트는 프로젝트 루트에서 실행한다** — 내부 경로가 루트 기준이다.

```
ml/
├─ ddl.sql                  # 테이블 생성 SQL (새 환경용 — 공유 Supabase엔 적용 완료)
├─ requirements.txt
├─ seed/                    # ① 데이터 생성·시드
│   ├─ aggregate_profiles.sql  # ★ 집계 SQL — 학습 CSV 추출과 앱 배치 스코어링이 같이 씀 (정합성 핵심)
│   ├─ generate.py            # CSV 4종 생성기 (seed=42 고정 — 재실행해도 동일 결과)
│   ├─ seed_db.py             # 세부 이벤트 시드 SQL 생성기 → seed_events.sql (git 무시, 8MB)
│   ├─ categories.csv · products.csv · users.csv   # DB 마스터 시드 (\copy 로드용)
│   └─ user_profiles.csv      # ML 학습용 (유저 1행 = 피처 + churned 라벨) — DB 없이 바로 학습 가능
├─ model/                   # ② 이탈 예측 ML
│   ├─ train_churn.py         # 학습 → churn_model.pkl (git 무시 — 재생성 가능)
│   └─ serve.py               # FastAPI 서빙 (:8000) — Spring 배치가 호출
├─ demo/                    # ③ 발표·시연 준비 (공유 DB 쓰기 — 실행 전 팀 공지)
│   └─ daily_activity.py      # 오늘자 신규 가입·주문 생성 (--undo 로 원복)
└─ _/                       # v1 아카이브 (팀원 제작, ML 1단계 테스트용 — 수정 금지)
     users.csv · user_profiles.csv · synthetic_products.csv · churn_prevention_history.csv
```

## 실행 순서 (공유 Supabase엔 이미 전부 적용됨 — 새 환경 셋업 시에만)

```bash
DB="postgresql://<노션의 접속 문자열>"        # 세션 풀러 5432 사용

# 0. 빈 테이블 생성
psql "$DB" -f ml/ddl.sql

# 1. 마스터 시드 로드 (순서 중요: categories → products → users)
cd ml/seed
psql "$DB" -c "\copy categories FROM 'categories.csv' CSV HEADER"
psql "$DB" -c "\copy products   FROM 'products.csv'   CSV HEADER"
psql "$DB" -c "\copy users      FROM 'users.csv'      CSV HEADER"
psql "$DB" -c "SELECT setval(pg_get_serial_sequence('users','user_id'), (SELECT MAX(user_id) FROM users));"
psql "$DB" -c "SELECT setval(pg_get_serial_sequence('products','product_id'), (SELECT MAX(product_id) FROM products));"
psql "$DB" -c "SELECT setval(pg_get_serial_sequence('categories','category_id'), (SELECT MAX(category_id) FROM categories));"

# 2. 세부 이벤트 시드 (주문·장바구니·찜·쿠폰·리뷰·대응이력 ~7만 행)
python3 seed_db.py          # → seed_events.sql 생성
psql "$DB" -f seed_events.sql

# 3. 정합 버전 학습 CSV 추출 (v3) — ML 재학습 시점에
#    aggregate_profiles.sql을 뷰로 만들어 \copy (자세한 건 파일 상단 주석)
#    → v3 피처 + (v2의 churned 라벨을 user_id로 조인) = 최종 학습 데이터
```

## ML 학습·서빙 (프로젝트 루트에서)

```bash
ml/.venv/bin/python ml/model/train_churn.py                          # 학습 → ml/model/churn_model.pkl
ml/.venv/bin/python -m uvicorn ml.model.serve:app --port 8000        # 서빙 (Spring 배치가 호출)
```

## 흐름 요약

```
[지금]   user_profiles.csv ──▶ ML 코드 개발·검증 (DB 불필요)
[재학습] aggregate_profiles.sql → v3 CSV → 파일만 교체해 재학습
                └─ 앱 배치 스코어링도 같은 쿼리 사용 = 학습 계산 ≡ 실전 계산
```

## 알아둘 것 (정직한 한계)

- 시드 날짜는 전부 `NOW()` 상대값 → **언제 실행해도** 룰(3일/7일/30일)에 걸리는 상태 유지
- v2(파이썬 직접 생성)와 v3(DB 집계)는 유저 단위로 거의 일치 (검증: 12개 피처 중 10개 100%, total_spend 98%)
  — 완전 동일하지는 않음 → **v3가 최종 기준**, v3로 재학습하면 학습=실전 정합 완성
- `churned` 라벨은 DB에 없음 (의도) — 라벨은 생성 시점의 확률 조합 산물이므로 v2 CSV에서 user_id로 조인
- 만족도(satisfaction_score)는 응답률 ~40%, 미응답 = 결측 → ML 전처리에서 중립(3.0) 대체
- 학습 시 `seed_group`·`seed_type` 컬럼은 **반드시 제외** (시드 검증용 꼬리표 — 넣으면 치팅)
- 관리자 계정: `admin@kopang.com` (user_id 4001) — 비밀번호는 v1 해시 그대로(팀원 확인 필요)
