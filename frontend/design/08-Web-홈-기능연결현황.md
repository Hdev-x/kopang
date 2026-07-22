# Web 홈 기능 연결 현황

> 기준일: 2026-07-22
> 대상: `/web` Header·Home·Footer·QuickBar·Chatbot
> 판정 기준: 화면이 보이는지가 아니라 사용자가 실제 데이터로 기능을 끝까지 사용할 수 있는가

## 1. 현재 바로 사용 가능한 영역

| 영역 | 데이터·동작 | 연결 근거 |
|---|---|---|
| Header 로고·홈 | Web Home 이동 | React Router `/web` |
| Header 쇼핑 | 상품 목록 이동 | `/web/products` |
| Header 검색 | 검색어 입력·상품 결과 | 상품 검색 API, 검색 기록 API |
| 로그인·회원가입 | Web 인증 화면과 인증 API | `/web/login`, `/web/signup` |
| 장바구니 | 조회·선택·수량 변경·삭제 | Cart API |
| Home Hero | 실제 상품 이미지·상품 상세 이동 | 인기 상품 API 응답 |
| 카테고리 | 실제 카테고리 표시·목록 filter 이동 | Category API |
| 오늘의 특가 | 할인율이 있는 실제 상품 표시 | Product의 `discountRate` |
| 인기 상품 | 인기 정렬 상품 표시·상세 이동 | Product API `sort=popular` |
| 신상품 | 최신 정렬 상품 표시·상세 이동 | Product API `sort=latest` |
| 멤버십 | 상태·가입 결제·승인·해지·유지 | Membership API, Toss payment |
| 포인트 | 잔액·변동 내역 조회 | Point API |
| 최근 본 상품 | 브라우저에 저장된 최근 상품 표시 | `localStorage` |
| AI 상담봇 | 질문 전송·응답·fallback | Chatbot API, local rules |

## 2. 화면과 이동은 가능하지만 기능 보강이 필요한 영역

| 영역 | 현재 상태 | 추가 작업 |
|---|---|---|
| Header 추천 | 상품 목록으로 이동 | 추천 전용 API 또는 개인화 기준 연결 |
| Header 생활/인테리어 | 임시 category id 사용 | 실제 카테고리 id를 이름 기준으로 결정 |
| Hero carousel | 버튼으로 상품 전환 | 운영 banner API, 노출 기간, 자동 재생 정책 |
| 특가 | 할인 상품을 client에서 추출 | 특가 전용 API, 종료 시간·재고·쿠폰 정보 |
| 쇼핑 theme | 실제 상품을 임시 theme 문구로 묶음 | theme·기획전 API와 관리자 편집 기능 |
| 찜한 상품 바로가기 | Web 화면 뼈대로 이동 | Wishlist API 목록·삭제·Cart 이동 연결 |
| 주문·배송 바로가기 | Web 화면 뼈대로 이동 | Order API와 상태별 UI 연결 |
| 고객센터 | Web 화면 뼈대로 이동 | FAQ·Notice·Inquiry API 연결 및 form 검증 |
| 알림 | Web 화면 뼈대로 이동 | Notification API, 읽음 처리, `refId` 이동 |
| Footer 정책 링크 | 관련 Web 화면으로 이동 | 실제 이용약관·개인정보 문서와 확정 URL |
| 상품 card 찜 button | 시각 요소만 존재 | 로그인 gate와 Wishlist API 연결 |

## 3. 백엔드·데이터 설계가 먼저 필요한 영역

오늘의집 Home에 있지만 현재 Kopang 정본 API와 데이터에는 없는 기능이다.

- 집들이·집사진·커뮤니티 콘텐츠
- 콘텐츠 작성자 profile, 좋아요, 저장, 댓글
- 출석 check·challenge·event 참여
- 이사·청소·인터넷 신청 같은 생활 service
- 운영자가 순서와 기간을 정하는 Home banner CMS
- 사용자 행동 기반 개인화 추천 feed
- 기획전·package 할인·원하는 날 배송 전용 정책
- 실사업자 정보, 인증 mark, 통신판매 관련 법적 고지

이 영역은 UI를 먼저 실제 기능처럼 연결하지 않는다. 요구사항·DB·API·담당자를 팀에서 합의한 뒤 구현한다.

## 4. Home section별 현재 데이터 출처

```text
Hero                 → popular 상품 4개
바로가기             → 기존 Web route
카테고리             → GET /api/categories
오늘의 특가          → popular 상품 중 discountRate 존재 상품
멤버십 banner        → /web/membership
지금 많이 찾는 상품 → popular 상품
쇼핑 theme           → popular 상품 + 임시 UI 문구
새로 들어온 상품    → GET /api/products?sort=latest
```

## 5. 다음 연결 우선순위

1. Web 주문 내역·주문 상세에 기존 Order API 연결
2. Web Wishlist에 기존 Wishlist API 연결
3. Web 알림에 기존 Notification API 연결
4. Web FAQ·공지·문의에 기존 support API 연결
5. Home 전용 banner·기획전·추천 기능은 팀 합의 후 별도 설계

## 6. Web Category page

`/web/products`는 쇼핑 레퍼런스의 정보 구조를 참고해 다음 영역으로 구성한다.

- 쇼핑 전용 2차 Header navigation
- 왼쪽 계층형 category navigation
- 실제 상품 image를 활용한 기획 card carousel
- `discountRate` 기반 할인 상품 영역
- 정렬·filter UI와 전체 상품 grid

현재 바로 사용 가능:

- category 선택과 상품 API filter
- 인기·최신·가격순 정렬
- 상품 상세 이동
- 기획 card 이전·다음 이동

추가 작업 필요:

- `오늘의딜`·`단독상품` 전용 server query와 운영 정책
- 기획전 title·image·기간을 관리하는 CMS/API
- 무료배송·할인·재고 filter button의 실제 query 연결
- 상품 count를 위한 server의 `totalElements` 표시
