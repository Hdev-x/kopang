# Copang (코팡)

고객 행동·구매 패턴 데이터를 기반으로 **이탈 위험군을 정의하고 선제적으로 대응**하는 커머스 백엔드 프로젝트입니다.
(Kosmo163 Team Project · 4인 · 3주)

## 기술 스택

- **Backend**: Java, Spring Boot, MyBatis, Spring Security + JWT
- **Database**: PostgreSQL
- **Frontend**: 모바일 퍼스트 웹
- **협업**: GitHub, Notion

## 핵심 기능 — 이탈 위험군 1·6·8

| 위험군 | 판단 기준 | 대응 |
| --- | --- | --- |
| 1. 장바구니 방치 | 담은 뒤 3일간 주문 없음 | 리마인더 발송 (스케줄러 배치) |
| 6. 구독 해지 | 해지 버튼 클릭 | "아낀 배송비 합산" 모달로 록인 |
| 8. 주기성 단절 | 평균 구매주기 ×1.5 경과 | 리필 알림 (윈도우 함수) |

## 폴더 구조

```
copang/
├── backend/    # Spring Boot 서버
├── frontend/   # 모바일 퍼스트 웹
├── ml/         # 데이터/연산 (필요 시)
└── docs/       # 회의록·문서
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
