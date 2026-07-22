# Web 화면 구현 현황

> 기준: 2026-07-22 `feature/fe-web-design`
> 비교 대상: 현재 `AppRouter.tsx`의 사용자 화면. `/admin/*`는 독립 영역이므로 제외한다.

## 1. Web 구현 완료

- [x] `/web` — Web Home
- [x] `/web/products` — Web Category·ProductList
- [x] `/web/products/:id` — Web ProductDetail

## 2. Web 미구현 — 인증

- [x] Web Login — `/web/login`
- [x] Web Signup — `/web/signup`
- [x] Web FindPassword — `/web/find-password`
- [x] OAuth2 Callback 결과 처리 — Web에서 시작한 인증은 `/web` 복귀

인증 API와 token 처리는 공유하고 form 배치·안내 문구·Web Layout 적용 여부만 결정한다.

### 인증 구현 메모

- 기존 `api/auth.ts`와 `lib/auth.ts`를 공유한다.
- Web 인증 화면은 공통 `WebAuthLayout`을 사용한다.
- 로그인 성공 후 `/web`으로 이동한다.
- Web에서 소셜 로그인을 시작하면 임시 보기 모드를 저장하고 callback 완료 후 `/web`으로 돌아온다.
- 약관 문구는 화면 검증용이므로 팀 확정 약관으로 교체해야 한다.

## 3. Web 미구현 — 검색

- [ ] Web Search
- [ ] 검색 자동완성 또는 최근 검색어 표시
- [ ] 검색 결과를 Web Product grid로 연결

현재 Web Header 검색 영역은 `/web/products`로만 이동하는 임시 링크다.

## 4. Web 미구현 — 장바구니·주문·결제

- [ ] Web Cart 전체 페이지
- [ ] Web Checkout
- [ ] Web ResumeCheckout
- [ ] Web OrderComplete
- [ ] Web PaymentSuccess
- [ ] Web PaymentFail
- [ ] Web OrderHistory
- [ ] Web OrderDetail
- [ ] Web AddressManagement

QuickBar 장바구니 Modal은 요약 기능이며 전체 Cart 페이지를 대신하지 않는다.

## 5. Web 미구현 — 마이페이지

- [ ] Web MyPage
- [ ] Web EditProfile
- [ ] Web Wishlist
- [ ] Web PointHistory
- [ ] Web Coupon
- [ ] Web MyInquiries
- [ ] Web MyInquiryDetail

Web에서는 좌측 account navigation과 우측 content layout을 우선 검토한다.

## 6. Web 미구현 — 멤버십

- [ ] Web Membership
- [ ] Web MembershipSuccess
- [ ] Web MembershipFail

## 7. Web 미구현 — 알림

- [ ] Web Notifications

알림 API와 type·`refId` 이동 규칙은 기존 구현을 공유한다. Web에서는 목록 밀도와 filter/read 상태 UI만 별도 설계한다.

## 8. Web 미구현 — 고객지원·Q&A

- [ ] Web Support Home
- [ ] Web Support Inquiry
- [ ] Web NoticeList
- [ ] Web NoticeDetail
- [ ] Web FAQ
- [ ] Web QnaList
- [ ] Web QnaDetail
- [ ] Web QnaWrite

Web ProductDetail의 리뷰·문의 영역도 현재 placeholder이므로 기존 Review·Q&A API 연결이 남아 있다.

## 9. 구현 우선순위 제안

### 1차 — 핵심 구매 흐름

```text
Web Search
→ Web Cart
→ Web Checkout
→ 결제 결과
```

### 2차 — 구매 이후 흐름

```text
Web Login
→ Web MyPage
→ Web OrderHistory
→ Web OrderDetail
```

### 3차 — 유지·지원 흐름

```text
Web Wishlist
→ Web Notifications
→ Membership
→ Support·Q&A
```

## 10. 공통 사용 원칙

- API·type·인증·업무 규칙은 기존 코드를 공유한다.
- Web 화면 때문에 같은 API 함수를 복제하지 않는다.
- 페이지 JSX·CSS·navigation·interaction은 Web 전용으로 작성한다.
- 기존 mobile 화면은 Web 구현 과정에서 수정하지 않는다.
- 한 번에 전체 화면을 만들지 않고 기능 흐름 단위로 commit한다.
