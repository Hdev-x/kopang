# Copang API 명세 초안 (P0 코어)

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

## P1 이후 (회의에서 우선순위 확정 후 추가)
- `POST /api/memberships` / `DELETE` (가입/해지 — 위험군6)
- `GET /api/coupons` (내 쿠폰)
- `GET /api/notifications` (알림)
- 위험군 감지/대응은 **스케줄러 배치**라 외부 API보다 내부 로직 중심
  → 관리/확인용 `GET /api/admin/risk-flags` 정도

## 메모
- 페이징은 Spring `Page` 기본 포맷(`content`, `totalPages`...) 권장 → 프론트 일관성
- 토큰 만료/재발급 흐름은 프론트와 미리 합의 (인터셉터 처리)
- 이미지 업로드 응답은 **저장된 URL**을 돌려줘야 프론트가 바로 렌더 가능
