# Web 레퍼런스와 QuickBar 설계

> 상태: 1차 뼈대 구현, 시각 값·세부 기능 조정 예정

## 1. 화면별 레퍼런스

### Web Home

- URL: https://ohou.se/
- 참고할 것: 넓은 header, 상단 navigation, 큰 visual, category shortcut, section별 상품 card grid
- 그대로 복제하지 않을 것: 서비스 고유 logo·문구·image·색상·icon
- Kopang 적용: 기존 상품·카테고리 API를 사용해 Web 정보 구조만 참고

### Web Category/ProductList

- URL: https://ohou.se/store/category?category_id=10000000&order=popular
- 참고할 것: breadcrumb, category 탐색, filter·sort, 상품 grid, 정보 밀도
- Kopang 적용: `GET /api/categories`, `GET /api/products`를 공유하고 Web 전용 sidebar와 grid로 표현

### Web ProductDetail

- URL: https://store.ohou.se/goods/3515753
- 참고할 것: image gallery, 상품 정보, 가격·배송, 구매 box, 상세 tab
- Kopang 적용: `GET /api/products/:id`, 장바구니 API를 공유하고 Web 전용 좌우 layout으로 표현

### Web QuickBar

- 레퍼런스: 사용자가 첨부한 AliExpress 오른쪽 세로 고정 메뉴
- 참고할 것: viewport 오른쪽 고정, 세로 icon button, 쇼핑 중 빠른 보조 기능
- Kopang 구성: 장바구니, 최근 본 상품, 도움말, 맨 위로

## 2. QuickBar 1차 동작

```text
장바구니 클릭
→ 현재 페이지 유지
→ Modal 열기
→ 로그인·loading·empty·data 상태 표시

최근 본 상품 클릭
→ 현재 페이지 유지
→ Modal 열기
→ Web 상품 상세에서 저장한 최근 상품 표시

도움말 클릭
→ 현재 페이지 유지
→ Modal 열기
→ 고객센터 이동 제공

맨 위로 클릭
→ Modal 없이 smooth scroll
```

## 3. Modal을 먼저 쓰는 이유

- 구현이 단순해 QuickBar 콘텐츠와 상태를 빠르게 검증할 수 있다.
- 화면 중앙에서 사용자의 주의를 확실하게 모은다.
- 크기·정보량·버튼 구성을 결정한 뒤 다른 container로 옮기기 쉽다.

## 4. Drawer가 더 적합할 수 있는 이유

- 장바구니·최근 본 상품처럼 세로 목록이 길어져도 공간을 더 자연스럽게 사용할 수 있다.
- 원래 상품 화면을 일부 남겨 두어 비교·탐색 맥락을 유지할 수 있다.
- 오른쪽 QuickBar에서 오른쪽 panel이 열리므로 원인과 결과의 위치 관계가 분명하다.
- 목록 상품을 확인한 뒤 닫고 쇼핑을 이어가는 흐름에 적합하다.

Modal이 콘텐츠를 지나치게 가리거나 목록 scroll이 답답하면 `overlay`와 콘텐츠 상태는 유지하고 표시 container만 오른쪽 Drawer로 교체한다.

## 5. 아직 결정하지 않은 값

- QuickBar의 정확한 right 위치와 세로 위치
- icon 순서와 label/tooltip
- Modal width·height
- Modal animation
- backdrop 농도
- 최근 본 상품 저장 기간·최대 개수
- 비로그인 장바구니 정책
- 장바구니에서 수량 변경·삭제를 지원할지
- Modal과 Drawer 중 최종 방식

## 6. 브라우저에서 확인할 질문

- QuickBar가 상품 card나 구매 button을 가리는가?
- Modal을 열었을 때 원래 페이지를 봐야 할 필요가 있는가?
- 장바구니 상품이 5개 이상일 때 목록 확인이 편한가?
- 최근 본 상품에서 현재 상품을 구분해야 하는가?
- Modal 안에서 결제까지 이동할지, 장바구니 전체 페이지로 이동할지?
- ESC·backdrop·닫기 button 중 어떤 방식으로 닫을 수 있어야 하는가?

## 7. ProductDetail 상품정보 1차 구성

2026-07-22 기준으로 오늘의집의 긴 상세 정보 흐름을 참고해 다음 뼈대를 적용했다.

```text
상품 소개 heading
→ 대표 image
→ 상품 특징 editorial block
→ 검수·안심구매·배송 특징 card
→ 상품 기본정보 table
→ 리뷰 placeholder
→ 문의 placeholder
→ 배송·교환·환불 안내
```

현재 특징 문구와 배송 안내는 layout 검증을 위한 임시 콘텐츠다. 판매자·상품별 정책 API가 확정되면 실제 데이터로 교체해야 한다.

- 상품명·가격·상품번호·재고: 현재 상품 API 데이터 사용
- 대표 image: 현재 `imageUrl` 사용
- editorial 문구: 임시 UI 문구
- 리뷰·문의: 기존 API 연결 전 placeholder
- 배송·교환·환불: 공통 안내 뼈대이며 실제 판매자 정책 확인 필요
- `#delivery`: 배송·교환·환불 영역으로 직접 이동

## 8. ProductDetail Scroll Spy tab과 구매 panel

2026-07-22 오늘의집 상세 화면을 다시 참고해 상세 tab 아래를 다음 구조로 변경했다.

```text
Sticky Detail Tab
├─ 상품정보
├─ 리뷰 count
├─ 문의 count
└─ 배송/환불

Detail Workspace
├─ 왼쪽: 모든 상세 section을 연속 scroll
└─ 오른쪽: full-height sticky 구매 option·수량·금액·CTA panel
```

- 상품정보·리뷰·문의·배송/환불은 모두 한 페이지에 연속 배치한다.
- tab click은 해당 section으로 smooth scroll한다.
- 사용자가 직접 scroll하면 Scroll Spy가 현재 section의 tab을 활성화한다.
- URL hash를 변경해 `#review`, `#qna`, `#delivery` 직접 접근을 지원한다.
- 리뷰는 기존 상품 리뷰 API를 사용한다.
- 문의는 기존 상품별 문의 API를 사용한다.
- 오른쪽 구매 panel은 상세 tab 아래부터 viewport 하단까지 높이를 채운다.
- 왼쪽 전체 상세 내용을 scroll하는 동안 오른쪽 구매 panel의 option·금액·CTA는 유지된다.
- 실제 option API가 없으므로 option select는 현재 layout 검증용이다.
