# Kopang API 명세서

> ✅ **2026-07-02 회의 확정 — 프론트·백 공통 계약서.**
> 변경이 필요하면 팀 합의 후 이 문서를 먼저 수정한다 (코드보다 문서가 기준).
> 확정 내용: 위험 유형 8종 · PG(토스 테스트) 결제 · 만족도 수집 · 찜/주문취소/내쿠폰/포인트 · FastAPI 피처

## 위험 유형 코드 (공통 enum) — 확정 8종

`churn_score.risk_type` · `retention_intervention.risk_type` · `/api/admin/churn/customers?type=` 에서 공용.

| 코드 | 유형 | 감지 기준 |
| --- | --- | --- |
| `CART_ABANDON` | ① 장바구니 방치 | 담은 지 3일 경과 + 이후 주문 없음 |
| `MEMBERSHIP_CANCEL` | ② 멤버십 해지 | 해지 클릭 / status=CANCELLED |
| `FIRST_ORDER_ONLY` | ③ 첫구매 후 미복귀 | 주문 1건뿐 + 30일 경과 |
| `WISHLIST_IDLE` | ④ 찜 방치 | 찜 7일 경과 + 해당 상품 미주문 |
| `COUPON_EXPIRING` | ⑤ 쿠폰 만료 임박 | 미사용 쿠폰 만료 3일 전 |
| `BAD_EXPERIENCE` | ⑥ 부정경험 | 평점≤2 리뷰 또는 취소/반품 |
| `LOGIN_INACTIVE` | ⑦ 접속 뜸 | 마지막 로그인 30일 초과 |
| `SPENDING_DROP` | ⑧ 구매액 감소 | 최근 30일 지출 < 직전 30일의 50% |

> +`ML_HIGH` — 룰이 아닌 ML 등급 기반 대응일 때 사용.

## 공통 규칙
- Base URL: `/api`
- 인증: `Authorization: Bearer <accessToken>` (JWT)
- 요청/응답: `application/json` (이미지 업로드만 `multipart/form-data`)
- 응답 공통 포맷:
  ```json
  { "success": true, "data": { }, "message": null }
  ```
  > ※ 아래 각 엔드포인트 예시는 가독성을 위해 **`data` 내부만** 표기. 실제론 위 래퍼로 감쌈.
- 에러: `success: false` + `message`, HTTP 상태코드로 구분(400/401/403/404/500)
- **토큰 만료(401) 응답** ⭐ — 인터셉터의 refresh 분기가 의존하므로 코드로 구분:
  ```json
  // HTTP 401
  { "success": false, "code": "TOKEN_EXPIRED", "message": "토큰이 만료되었습니다" }
  ```
  → 프론트 인터셉터: `401 && code==="TOKEN_EXPIRED"` 이면 `/api/auth/refresh` 호출 후 원요청 재시도

---

## 1. 인증 (Auth)

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | 회원가입 | ✕ |
| POST | `/api/auth/login` | 로그인 → 토큰 발급 | ✕ |
| POST | `/api/auth/refresh` | accessToken 재발급 | ✕(refresh) |

> ⚠️ 로그인은 **Security 로그인 필터**가 처리(수업 방식). 필터의 `filterProcessesUrl`을
> `/api/auth/login`으로 맞출 것 (수업 예제 `/member/login` → 이 URL로 통일).
> 토큰 만료: access 15분 / refresh 7일.

```
POST /api/auth/signup
  req:  { "email": "a@a.com", "password": "...", "name": "홍길동" }
  res:  { "id": 1, "email": "a@a.com", "name": "홍길동" }

POST /api/auth/login
  req:  { "email": "a@a.com", "password": "..." }
  res:  { "accessToken": "...", "refreshToken": "...", "user": { "id":1, "name":"홍길동" } }
```

## 2. 상품 (Products)

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/products?category=&keyword=&page=&size=` | 목록(검색/필터/페이징) | ✕ |
| GET | `/api/products/{id}` | 상세 | ✕ |
| GET | `/api/products/{id}/similar` | 비슷상품 추천 (P1) | ✕ |

> ⚠️ 파라미터명 통일: FE 현재 코드는 `?cat=` 사용 중 → **`category`로 통일** (FE 수정 필요).

```
GET /api/products?category=식품&page=0&size=20
  res: { "content": [ { "id":1, "name":"오이", "price":1500, "imageUrl":"..." } ],
         "number":0, "totalPages":5, "totalElements":98 }   // Spring Page 필드명 그대로

GET /api/products/1
  res: { "id":1, "name":"오이", "price":1500, "description":"...", "stock":50, "imageUrl":"..." }
```

## 3. 장바구니 (Cart) — 🔒 인증

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/cart` | 내 장바구니 조회 |
| POST | `/api/cart` | 상품 담기 |
| PATCH | `/api/cart/{itemId}` | 수량 변경 |
| DELETE | `/api/cart/{itemId}` | 항목 삭제 |

```
POST /api/cart
  req: { "productId": 1, "quantity": 2 }
  res: { "itemId": 10, "productId":1, "quantity":2 }
```

## 4. 주문 (Orders) — 🔒 인증

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/orders` | 주문 생성 (결제 대기 상태) |
| POST | `/api/payments/confirm` | **PG 결제 승인** (토스 테스트) → 주문 확정 |
| GET | `/api/orders` | 내 주문 목록 |
| GET | `/api/orders/{id}` | 주문 상세 |
| POST | `/api/orders/{id}/cancel` | 주문 취소 → `order_status=CANCELLED` (⑥부정경험 감지 원천) |

**결제 플로우 (토스페이먼츠 테스트 키 · mock 폴백 유지)**
```
1. POST /api/orders            → 주문 생성 (payment_status=PENDING, 금액 확정)
2. FE 토스 결제위젯 호출        → 테스트 카드 결제 → successUrl로 paymentKey·orderId·amount 수신
3. POST /api/payments/confirm  → BE가 토스 승인 API 호출(시크릿 키) + 금액 검증
     req: { "orderId": 100, "paymentKey": "...", "amount": 4500 }
     res: { "orderId": 100, "status": "PAID" }
   → orders.payment_key 저장, payment_status=PAID
※ PG 장애/미연동 환경에서는 mock 결제(즉시 PAID)로 폴백 — 데모 리스크 대비
※ 시크릿 키는 BE .env 전용 (FE·git 노출 금지). 실결제·정산은 사업자 필요 → 테스트 모드만 사용
```

```
POST /api/orders
  req: { "cartItemIds": [10, 11] }   // 또는 전체 장바구니
  res: { "orderId": 100, "totalAmount": 4500, "status": "PAID" }
```

## 5. 리뷰 (Reviews)

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/products/{id}/reviews` | 상품 리뷰 목록(착샷 포함) | ✕ |
| POST | `/api/products/{id}/reviews` | 리뷰 작성 (이미지 업로드) | 🔒 |

```
POST /api/products/1/reviews   (multipart/form-data)
  req:  rating=5, content="좋아요", image=<file>
  res:  { "reviewId": 50, "imageUrl": "..." }
```

---

---

## 5-1. 찜 (Wishlist) — 🔒 인증
> ④찜방치 감지의 데이터 원천. FE `/my/wishlist` 화면 대응.

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/wishlist` | 내 찜 목록 |
| POST | `/api/wishlist` | 찜 등록 `{ "productId": 1 }` |
| DELETE | `/api/wishlist/{productId}` | 찜 해제 |

## 5-2. 쿠폰 / 포인트 — 🔒 인증
> ⑤쿠폰만료임박 표시 + FE `/my/coupons` · `/my/points` 화면 대응.

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/coupons/me` | 내 쿠폰함 (`used`, `expiresAt` 포함 → 만료임박 표시) |
| GET | `/api/points` | 내 포인트 내역 |

## 6. 추천 (Recommendations)

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/recommendations` | 맞춤 추천 (item-CF 결과, 콜드스타트는 룰) | 🔒 |
| GET | `/api/products/{id}/similar` | 비슷한 상품 (룰: 카테고리/가격) | ✕ |
| POST | `/api/recommendations/{id}/click` | 추천 클릭 기록 (효과 측정) | 🔒 |

```
GET /api/recommendations
  res: { "items": [ { "productId":1, "name":"오이", "score":0.92, "reason":"함께 구매" } ] }
```

## 7. 알림 (Notifications) — 🔒 인증

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/notifications` | 내 알림 목록 (방치/재구매/쿠폰/추천/공지) |
| PATCH | `/api/notifications/{id}/read` | 읽음 처리 (= 대응 클릭 추적) |

```
GET /api/notifications
  res: { "items": [ { "id":1, "type":"ABANDON", "message":"...", "read":false, "createdAt":"..." } ] }
```

> `type` 값 (유형 8종 대응 반영): `ABANDON`(①리마인더) / `REBUY`(⑧재구매) / `WISHLIST`(④찜 할인) /
> `COUPON_EXPIRE`(⑤만료임박) / `WELCOME_BACK`(③웰컴백) / `APOLOGY`(⑥사과쿠폰) / `COMEBACK`(⑦복귀) / `RECOMMEND` / `NOTICE`

## 7-1. 만족도 평가 (Satisfaction) — 🔒 인증
> 서비스(페이지) 만족도 별점. 주문완료 페이지 등에서 수집 → `satisfaction_survey` 저장 → ML 피처(`satisfaction_score`) 원천.
> 프론트 위젯은 추후 작업(주문완료 페이지 예정). 응답률 낮음 전제 — 미응답은 결측 처리.

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/satisfaction` | 만족도 제출 |

```
POST /api/satisfaction
  req: { "score": 4, "context": "ORDER" }   // score 1~5, context: ORDER / CANCEL / CS
  res: { "id": 10 }
```

## 8. 문의 (Inquiries) — 🔒 인증
> 상품문의(상세페이지) + 1:1 일반문의(고객센터)를 한 테이블로. 공지사항과는 별도.
> ⚠️ 경로 통일: FE 목업이 현재 `/api/qna` 사용 중 → **`/api/inquiries`로 통일** (FE 수정 필요).

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/inquiries?type=PRODUCT|GENERAL` | 내 문의내역 (탭별) |
| GET | `/api/inquiries/{id}` | 문의 상세 (질문+답변) |
| POST | `/api/inquiries` | 문의 등록 |

```
POST /api/inquiries
  req: { "type":"PRODUCT", "productId":1, "title":"재고 문의", "content":"..." }   // GENERAL이면 productId 생략
  res: { "id": 10, "status":"답변대기" }
```

## 9. 공지 / FAQ

| Method | Path | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/notices` | 공지사항 목록 | ✕ |
| GET | `/api/notices/{id}` | 공지 상세 | ✕ |
| GET | `/api/faqs` | 자주 묻는 질문 | ✕ |

## 10. 멤버십 (Membership) — 🔒 인증

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/memberships/me` | 내 멤버십 상태 |
| POST | `/api/memberships` | 가입(업셀) |
| POST | `/api/memberships/cancel` | 해지 신청 → **만류 모달**(아낀 배송비 연산) |

---

## 11. 관리자 (Admin) — 🔒 `ROLE_ADMIN` 전용
> 로그인 응답의 `role`로 구분. `/api/admin/**` 는 Security에서 ADMIN만 통과.

**이탈 (churn)**
| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/admin/churn/summary` | 대시보드 집계(위험도 분포 · **유형별 분포** · 이탈율 · 효과) |
| GET | `/api/admin/churn/customers?type=&level=` | 위험 고객 목록. `type`=위험 유형 8종 enum · `level`=`HIGH/MID/LOW` |
| GET | `/api/admin/churn/report?from=&to=` | 대응 효과 리포트(처치군 vs 대조군 순효과) |
| GET | `/api/admin/interventions?type=` | 대응 이력(자동 발송 로그). `type`=위험 유형 enum |
| GET | `/api/admin/membership` | 멤버십 현황(해지위험·유지율·전환) |

```
GET /api/admin/churn/customers?type=CART_ABANDON&level=HIGH
  res: { "content": [ { "userId":1, "name":"김민수", "isMember":false,
         "score":0.87, "riskLevel":"HIGH", "riskType":"CART_ABANDON",
         "detectedAt":"2026-07-01T09:00:00", "suggestedAction":"COUPON" } ], ... }

GET /api/admin/churn/summary
  res: { "levelCounts": { "HIGH":143, "MID":312, "LOW":1945 },
         "typeCounts": { "CART_ABANDON":80, "MEMBERSHIP_CANCEL":21, "FIRST_ORDER_ONLY":45,
                          "WISHLIST_IDLE":60, "COUPON_EXPIRING":95, "BAD_EXPERIENCE":18,
                          "LOGIN_INACTIVE":110, "SPENDING_DROP":33 },
         "weeklyChurnRate": [ ... ], "effect": { ... } }
```

**운영**
| Method | Path | 설명 |
| --- | --- | --- |
| GET / POST | `/api/admin/products` | 상품 목록 / 등록 |
| PUT | `/api/admin/products/{id}` | 상품 수정 |
| GET | `/api/admin/orders?ship=` | 전체 주문(상태 필터) |
| PATCH | `/api/admin/orders/{id}/ship` | 배송 처리 |
| GET | `/api/admin/members?q=` | 회원 목록(검색) |
| GET / POST | `/api/admin/coupons` | 쿠폰 목록 / 발급 |

## 12. 내부 — ML 서빙 (FastAPI, 외부 API 아님)
> Spring ↔ FastAPI(WebClient). 배치 스코어링 결과를 DB에 저장, 화면은 DB만 읽음.

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `(FastAPI) /predict/churn` | 이탈 확률 예측(로지스틱) |
| POST | `(FastAPI) /recommend` | 맞춤 추천 |

```
POST /predict/churn        // 입력 피처 = 유형 8종을 수치화한 것 (학습 SQL과 동일 계산)
  req: { "users": [ { "userId":1,
          "cartAbandonCount":2,      // ①
          "membershipCancelled":0,   // ②
          "orderCount":1,            // ③
          "wishlistIdleCount":3,     // ④
          "couponUnusedCount":1,     // ⑤
          "badReviewCount":0,        // ⑥ (취소·반품 수 cancelCount 별도)
          "cancelCount":0,
          "recencyDays":35,          // ⑦
          "spendingDropRatio":0.4,   // ⑧
          "satisfactionScore":4,     // 만족도(미응답 시 null → 중립 대체)
          "tenureDays":120, "totalSpend":250000 } ] }
  res: { "results": [ { "userId":1, "score":0.83, "riskLevel":"HIGH", "modelVersion":"v1" } ] }
```

> 대응(쿠폰/알림/추천) **자동 발송**은 스케줄러 배치 로직 → 외부 API 아님. 관리자는 결과만 조회.

## 메모
- 페이징은 Spring `Page` 기본 포맷(`content`, `totalPages`...) 권장 → 프론트 일관성
- 토큰 만료/재발급 흐름은 프론트와 미리 합의 (인터셉터 처리)
- 이미지 업로드 응답은 **저장된 URL**을 돌려줘야 프론트가 바로 렌더 가능
