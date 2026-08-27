# Kopang (코팡)

고객 행동과 구매 패턴을 분석해 **이탈 위험을 감지하고, 맞춤 대응의 효과까지 측정**하는 풀스택 커머스 프로젝트입니다.
(Kosmo163 Team Project · 4인)

## 기술 스택

- **Frontend**: React 19 · TypeScript 6 · Vite 8 · React Router · Axios
  - 모바일 화면과 데스크톱 웹 화면
- **Backend**: Java 21 · Spring Boot 3.5 · MyBatis · Spring Security
  - JWT · OAuth2 · Mail · AWS S3
- **Database**: PostgreSQL
- **ML**: Python · FastAPI · pandas · numpy · scikit-learn
  - Logistic Regression 기반 이탈 확률 예측
- **추천**: MyBatis · PostgreSQL
  - item 기반 협업 필터링과 인기 상품 fallback
- **협업**: GitHub · Notion

## 핵심 — 감지부터 효과 측정까지

```
고객 행동 데이터
    → 룰·ML 기반 위험 감지
    → 처치군·대조군 분리
    → 알림·쿠폰·모달 등 맞춤 대응
    → 7일간 전환·재방문 측정
    → 관리자 대시보드·효과 리포트
```

**룰과 ML의 역할**

- **Rule Engine**: 명확한 행동 조건으로 위험 유형과 원인을 감지
- **ML Model**: 여러 약한 신호를 결합해 이탈 확률을 예측
- **Blind Spot Detection**: 룰이 찾지 못한 ML 고위험 고객을 별도로 추적

## 이탈 위험 유형 8종

| # | 위험 유형 | 주요 감지 기준 | 현재 대응 |
| --- | --- | --- | --- |
| ① | 장바구니 방치 | 상품을 담은 뒤 3일 이상 유효 주문 없음 | 홈 배너 실시간 노출 |
| ② | 멤버십 해지 | 멤버십 해지 시도 또는 해지 완료 | 실시간 만류 모달 |
| ③ | 첫구매 후 미복귀 | 첫 주문 이후 30일 이상 재구매 없음 | 복귀 쿠폰과 알림 |
| ④ | 찜 방치 | 찜한 뒤 7일 이상 미구매 | 찜 상품 할인 알림 |
| ⑤ | 쿠폰 만료 임박 | 미사용 쿠폰 만료 3일 전 | 만료 안내 알림 |
| ⑥ | 부정경험 | 저평점 리뷰 또는 취소·반품 | 신호 수집·분석 |
| ⑦ | 접속 뜸 | 마지막 로그인 후 30일 초과 | 복귀 쿠폰과 알림 |
| ⑧ | 구매액 감소 | 최근 30일 지출이 직전 30일의 50% 미만 | 대시보드·ML 피처 활용 |

> 모든 감지 유형이 자동 발송으로 이어지는 것은 아닙니다. 중복 대응과 과잉 발송을 막기 위해 유형별 전용 대응 경로를 사용합니다.

## 대응 효과 측정

- 고객을 처치군과 대조군으로 분리
- 대응 후 7일을 전환 측정 기간으로 사용
- 결제 완료 주문과 재방문 여부를 측정
- 하나의 주문은 가장 가까운 대응 하나에만 귀속
- 처치군과 대조군의 전환율 차이로 순효과 확인

## 폴더 구조

```
kopang/
├── frontend/   # React 사용자·관리자·데스크톱 웹
├── backend/    # Spring Boot API·인증·배치·대응·측정
├── ml/         # 이탈 예측 모델·FastAPI 서빙·데모 데이터
├── docs/       # 요구사항·API·DB 명세
└── outputs/    # 최종 발표자료 등 공유 산출물
```

## 브랜치 전략

```
main          # 발표/배포용 안정 버전 (직접 커밋 금지)
 └ develop     # 통합 브랜치
    └ feature/*  # 개인 작업 (예: feature/be-auth, feature/fe-cart)
```

- 모든 작업은 `feature/*`에서 → `develop`으로 **Pull Request**
- PR은 **리뷰어 1명 이상 승인** 후 머지
- `main`/`develop` 직접 커밋 금지

## 커밋 컨벤션

```
feat:     기능 추가
fix:      버그 수정
refactor: 리팩터링
docs:     문서
chore:    설정·기타
```
