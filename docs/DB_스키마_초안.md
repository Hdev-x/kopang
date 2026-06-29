# Copang DB 스키마 초안 (P0 코어 + 이탈 위험군)

> ⚠️ **확정 아님 — 회의 논의용 출발점.** 수정하면서 키운다.
> P0(코어)부터 확정하고 시작 → P1은 해당 기능 들어갈 때 추가.
> 아래 DBML을 [dbdiagram.io](https://dbdiagram.io) 에 붙여넣으면 ERD 그림으로 볼 수 있음.

---

## DBML (dbdiagram.io 용)

```dbml
// ===== P0: 코어 (이게 다 돼야 쇼핑몰 + 이탈 데이터 성립) =====

Table users {
  id            bigint [pk, increment]
  email         varchar [unique, not null]
  password_hash varchar [not null]
  name          varchar [not null]
  role          varchar [not null, default: 'USER'] // USER / ADMIN
  last_login_at timestamp  // 위험군 판단용 (마지막 접속)
  created_at    timestamp [not null, default: `now()`]
}

Table products {
  id          bigint [pk, increment]
  name        varchar [not null]
  description text
  price       int [not null]
  category    varchar
  stock       int [not null, default: 0]
  image_url   varchar
  created_at  timestamp [not null, default: `now()`]
}

Table cart_items {
  id         bigint [pk, increment]
  user_id    bigint [ref: > users.id, not null]
  product_id bigint [ref: > products.id, not null]
  quantity   int [not null, default: 1]
  created_at timestamp [not null, default: `now()`] // 담은 시각 — 위험군1(장바구니 방치) 판단 핵심
  updated_at timestamp

  indexes {
    (user_id, product_id) [unique]
  }
}

Table orders {
  id           bigint [pk, increment]
  user_id      bigint [ref: > users.id, not null]
  total_amount int [not null]
  status       varchar [not null, default: 'PAID'] // PAID / CANCELLED (결제는 mock)
  ordered_at   timestamp [not null, default: `now()`] // 위험군8(주기성 단절) 구매주기 계산
}

Table order_items {
  id         bigint [pk, increment]
  order_id   bigint [ref: > orders.id, not null]
  product_id bigint [ref: > products.id, not null]
  quantity   int [not null]
  price      int [not null] // 주문 시점 가격 스냅샷
}

Table reviews {
  id         bigint [pk, increment]
  user_id    bigint [ref: > users.id, not null]
  product_id bigint [ref: > products.id, not null]
  rating     int [not null] // 1~5
  content    text
  image_url  varchar // 포토 리뷰(착샷, L1) — 없으면 일반 리뷰
  created_at timestamp [not null, default: `now()`]
}

// ===== P1: 멤버십 / 이탈 대응 =====

Table memberships {
  id           bigint [pk, increment]
  user_id      bigint [ref: > users.id, not null]
  status       varchar [not null, default: 'ACTIVE'] // ACTIVE / CANCELLED
  started_at   timestamp [not null, default: `now()`]
  cancelled_at timestamp // 위험군6(구독 해지) 판단
}

Table coupons {
  id         bigint [pk, increment]
  user_id    bigint [ref: > users.id, not null]
  name       varchar [not null]
  discount   int [not null]   // 할인액(원) or %
  issued_at  timestamp [not null, default: `now()`]
  expires_at timestamp
  used       boolean [not null, default: false]
  reason     varchar // 발급 사유 (예: RISK_CART_ABANDON) — 이탈 대응 추적
}

Table notifications {
  id         bigint [pk, increment]
  user_id    bigint [ref: > users.id, not null]
  type       varchar [not null] // REMINDER / REFILL / DISCOUNT
  message    varchar [not null]
  is_read    boolean [not null, default: false]
  created_at timestamp [not null, default: `now()`]
}

// 이탈 위험군 감지 기록 (스케줄러/배치가 남김)
Table risk_flags {
  id          bigint [pk, increment]
  user_id     bigint [ref: > users.id, not null]
  risk_type   int [not null] // 1=장바구니방치, 6=구독해지, 8=주기성단절
  detected_at timestamp [not null, default: `now()`]
  action      varchar // 취한 대응 (쿠폰/알림 등)
  status      varchar [not null, default: 'DETECTED'] // DETECTED / ACTED / RECOVERED
}

// ===== (선택) Refresh 토큰 서버 저장 — "Refresh 서버 저장" 확정 시에만 추가 =====
// 수업은 클라이언트로만 보냄. 로그아웃/재발급을 정교하게 하려면 서버에 저장.
// 3주 일정상 스트레치 → 안 할 거면 이 테이블 생략.
// Table refresh_tokens {
//   id         bigint [pk, increment]
//   user_id    bigint [ref: > users.id, not null]
//   token      varchar [not null]
//   expires_at timestamp [not null]
//   created_at timestamp [not null, default: `now()`]
// }
```

---

## 테이블 요약

| 테이블 | 단계 | 역할 | 이탈 연결 |
| --- | --- | --- | --- |
| users | P0 | 회원 | `last_login_at` = 휴면 판단 |
| products | P0 | 상품 | — |
| cart_items | P0 | 장바구니 | `created_at` = **위험군1** 판단 핵심 |
| orders | P0 | 주문 | `ordered_at` = **위험군8** 주기 계산 |
| order_items | P0 | 주문 상세 | 구매주기/추천 데이터 |
| reviews | P0~P1 | 리뷰(+착샷) | 예방형 UGC |
| memberships | P1 | 멤버십 | `cancelled_at` = **위험군6** 판단 |
| coupons | P1 | 쿠폰 | 이탈 **대응** 산출물 |
| notifications | P1 | 알림 | 리마인더/리필/할인 알림 |
| risk_flags | P1 | 위험군 감지 로그 | 직접형 핵심 — 감지·대응·회복 추적 |

## 설계 메모
- **이탈 위험군 3개의 판단 데이터는 코어 테이블에 이미 들어있음** → 별도 행동로그 테이블 없이 시작 가능
  - 위험군1: `cart_items.created_at` 후 3일간 `orders` 없음
  - 위험군6: `memberships.cancelled_at`
  - 위험군8: `orders.ordered_at` 평균 간격 ×1.5 경과
- 가격은 변하므로 `order_items.price`에 **주문 시점 스냅샷** 저장
- 결제는 mock → `orders.status` 기본 `PAID`
- 추천(content-based)은 `products.category` + 향후 태그 테이블로 확장
- **(선택) `refresh_tokens`** — "Refresh 토큰 서버 저장"을 확정할 때만 추가. 위 DBML 하단 주석 참고 (안 하면 생략)
