# Kopang (코팡)

고객 행동·구매 패턴 데이터를 기반으로 **이탈 위험군을 예측하고 선제적으로 대응**하는 풀스택 커머스 프로젝트입니다.
(Kosmo163 Team Project · 4인 · 3주)

## 기술 스택

- **Frontend**: React · TypeScript · Vite (모바일 퍼스트 웹)
- **Backend**: Java · Spring Boot · MyBatis · Spring Security + JWT
- **Database**: PostgreSQL
- **ML / 추천**: Python · FastAPI · pandas · numpy · scikit-learn
  - 이탈 예측(로지스틱 회귀) · 맞춤 추천(item 기반 협업필터링)
- **협업**: GitHub · Notion

## 핵심 — 이탈 방지 닫힌 루프

```
①예측 → ②대응(자동) → ③효과 측정 → ④대시보드 → 관리자가 다음 액션 결정
```

**2층 구조 (룰 + ML)**

- **룰 층** (SQL·배치): ML 없이도 도는 안전망 + ML 학습 라벨 생성
- **ML 층**: 이탈 확률 점수(고/중/저) + 맞춤 추천

**이탈 위험 유형 8종 (확정)**

| # | 유형 | 감지 기준 | 대응 |
| --- | --- | --- | --- |
| ① | 장바구니 방치 | 담은 뒤 3일간 주문 없음 | 리마인더 → 쿠폰 |
| ② | 멤버십 해지 | 해지 클릭 / CANCELLED | "아낀 배송비" 만류 모달 + 윈백 쿠폰 |
| ③ | 첫구매 후 미복귀 | 주문 1건뿐 + 30일 경과 | 웰컴백 쿠폰 + 맞춤 추천 |
| ④ | 찜 방치 | 찜 7일 경과 + 미주문 | 찜 상품 할인/재입고 알림 |
| ⑤ | 쿠폰 만료 임박 | 미사용 쿠폰 만료 3일 전 | 만료 임박 알림 |
| ⑥ | 부정경험 | 평점≤2 리뷰 or 취소/반품 | 사과 쿠폰 + CS 안내 |
| ⑦ | 접속 뜸 | 마지막 로그인 30일 초과 | 복귀 쿠폰 |
| ⑧ | 구매액 감소 | 최근 30일 지출 < 직전 30일의 50% | 재구매 알림 + 맞춤 추천 |

**대응 효과 측정**: 처치군 vs 대조군(holdout) 전환율 차이 = 순효과(기여도) → 대시보드 시각화

## 폴더 구조

```
kopang/
├── frontend/   # React 모바일 퍼스트 웹 (회원 · 관리자 화면)
├── backend/    # Spring Boot 서버 (API · 인증 · 배치)
├── ml/         # 이탈 예측 · 추천 (FastAPI 서빙)
└── docs/       # 명세 · 구조 문서
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
