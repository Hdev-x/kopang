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

- [x] Web Search — `/web/search`
- [x] 최근 검색어 표시
- [x] 검색 결과를 Web Product grid로 연결

Web Header 검색 영역은 `/web/search`로 이동하며 상품 검색 API와 최근 검색어 API를 공유한다. 자동완성은 아직 적용하지 않았다.

## 4. Web 미구현 — 장바구니·주문·결제

- [x] Web Cart 전체 페이지 — API 연결
- [x] Web Checkout — 화면 뼈대
- [x] Web ResumeCheckout — 화면 뼈대
- [x] Web OrderComplete — 화면 뼈대
- [x] Web PaymentSuccess — 화면 뼈대
- [x] Web PaymentFail — 화면 뼈대
- [x] Web OrderHistory — 화면 뼈대
- [x] Web OrderDetail — 화면 뼈대
- [x] Web AddressManagement — 화면 뼈대

QuickBar 장바구니 Modal은 요약 기능이며 전체 Cart 페이지를 대신하지 않는다.

## 5. Web 미구현 — 마이페이지

- [x] Web MyPage — 화면 뼈대
- [x] Web EditProfile — 화면 뼈대
- [x] Web Wishlist — 화면 뼈대
- [x] Web PointHistory — 잔액·변동 내역 API 연결
- [x] Web Coupon — 화면 뼈대
- [x] Web MyInquiries — 화면 뼈대
- [x] Web MyInquiryDetail — 화면 뼈대

Web에서는 좌측 account navigation과 우측 content layout을 우선 검토한다.

## 6. Web 미구현 — 멤버십

- [x] Web Membership — 상태·가입 결제·해지·유지 API 연결
- [x] Web MembershipSuccess — 결제 승인 API 연결
- [x] Web MembershipFail — 결제 오류 정보 표시

## 7. Web 미구현 — 알림

- [x] Web Notifications — 화면 뼈대

알림 API와 type·`refId` 이동 규칙은 기존 구현을 공유한다. Web에서는 목록 밀도와 filter/read 상태 UI만 별도 설계한다.

## 8. Web 미구현 — 고객지원·Q&A

- [x] Web Support Home — 화면 뼈대
- [x] Web Support Inquiry — 화면 뼈대
- [x] Web NoticeList — 화면 뼈대
- [x] Web NoticeDetail — 화면 뼈대
- [x] Web FAQ — 화면 뼈대
- [x] Web QnaList — 화면 뼈대
- [x] Web QnaDetail — 화면 뼈대
- [x] Web QnaWrite — 화면 뼈대

Web ProductDetail 안의 리뷰·상품 문의 목록은 기존 API에 연결됐다. 고객지원·Q&A의 독립 Web page 제작은 별도로 남아 있다.

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

## 11. Web 공통 보조 영역

- [x] Header 고객센터 바로가기
- [x] Web Footer — 쇼핑·고객지원·서비스 navigation과 프로젝트 고지
- [x] Web AI 상담봇 — 기존 `/chatbot` API 공유
- [x] 챗봇 API 실패 시 기존 규칙 기반 fallback 답변 사용

Footer와 챗봇은 공통 `WebLayout`에서 제공하므로 Web 사용자 화면에 일괄 적용한다. 인증 전용 `WebAuthLayout`은 집중도를 위해 Footer와 QuickBar를 표시하지 않는다.

## 12. 로그인 Header와 My navigation

- [x] 로그인 Header: 저장·미읽음 알림 badge·장바구니·원형 profile
- [x] profile dropdown: 마이페이지·나의 쇼핑·문의·멤버십·고객센터·로그아웃
- [x] My 1차 navigation: 프로필·나의 쇼핑·나의 리뷰·설정
- [x] My 영역별 2차 navigation
- [x] 리뷰 작성 가능 목록·작성 리뷰 화면 뼈대

미읽음 알림 badge는 Notification API를 사용한다. 주문·찜·쿠폰·리뷰·설정의 세부 화면은 현재 Web layout 뼈대이며 실제 API 연결 여부는 각 항목에 별도로 표시한다.
