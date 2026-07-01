# Kopang API 명세 초안 (P0 코어)

> ⚠️ **확정 아님 — 프론트·백 "계약서"의 출발점.** 회의에서 같이 다듬는다.
> 이게 합의되면 → 백엔드 안 끝나도 프론트가 **mock 데이터로 병렬 작업** 가능.

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
| POST | `/api/orders` | 주문 생성 (장바구니 기반, 결제 mock) |
| GET | `/api/orders` | 내 주문 목록 |
| GET | `/api/orders/{id}` | 주문 상세 |

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

## 8. 문의 (Inquiries) — 🔒 인증
> 상품문의(상세페이지) + 1:1 일반문의(고객센터)를 한 테이블로. 공지사항과는 별도.

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
| GET | `/api/admin/churn/summary` | 대시보드 집계(위험도 분포·이탈율·효과) |
| GET | `/api/admin/churn/customers?type=&level=` | 위험 고객 목록(일반/멤버십·등급) |
| GET | `/api/admin/churn/report?from=&to=` | 대응 효과 리포트(처치군 vs 대조군 순효과) |
| GET | `/api/admin/interventions?type=` | 대응 이력(자동 발송 로그) |
| GET | `/api/admin/membership` | 멤버십 현황(해지위험·유지율·전환) |

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
| POST | `(FastAPI) /recommend` | 맞춤 추천(item-CF) |

> 대응(쿠폰/알림/추천) **자동 발송**은 스케줄러 배치 로직 → 외부 API 아님. 관리자는 결과만 조회.

## 메모
- 페이징은 Spring `Page` 기본 포맷(`content`, `totalPages`...) 권장 → 프론트 일관성
- 토큰 만료/재발급 흐름은 프론트와 미리 합의 (인터셉터 처리)
- 이미지 업로드 응답은 **저장된 URL**을 돌려줘야 프론트가 바로 렌더 가능
