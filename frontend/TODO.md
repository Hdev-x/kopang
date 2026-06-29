# Frontend 마일스톤 (내가 마저 할 작업)

> 토대(토큰/컴포넌트/라우팅/MSW/axios)는 완료. 아래는 직접 이어서 할 것.
> 패턴 참고: `ProductListPage.tsx` (useEffect → api 함수 → MSW/백엔드 → 화면)

## 1. 남은 페이지 ↔ API 연결 (최우선)
- [ ] **ProductDetailPage** — `getProduct(Number(id))` + `useEffect`로 상세 fetch
  - `api/products.ts`의 `getProduct` 이미 있음. 목록 페이지랑 같은 틀
- [ ] **LoginPage** — `handleSubmit`에서 `login(email, password)` 호출
  - `api/auth.ts`의 `login` 사용
  - 성공 시 `sessionStorage.setItem("accessToken", ...)` / `"refreshToken"` 저장 → 메인으로 이동(`useNavigate`)
- [ ] **CartPage** — 장바구니 조회 (API: `GET /api/cart`)
  - `api/cart.ts` 새로 만들어서 `getCart()` 추가 → MSW handler도 추가

## 2. MSW 핸들러 보강
- [ ] `mocks/handlers.ts`에 `POST /api/auth/refresh` 추가 → 인터셉터 401 재시도 동작 테스트
- [ ] 장바구니/주문 등 쓰는 엔드포인트 핸들러 추가

## 3. 인증 상태 관리
- [ ] 로그인 여부에 따라 헤더 표시 바꾸기 (로그인/로그아웃 버튼)
- [ ] `useAuth` 커스텀 훅 고려 (`hooks/`)

## 4. 마무리 (나중)
- [ ] 데스크탑 반응형 (미디어쿼리 `@media (min-width: 768px)` 추가) — 선택
- [ ] 데모 잔재 삭제: `src/App.css`, `src/index.css`, `src/assets/` 미사용 파일
- [ ] 기능 확정 후 페이지 추가 (회원가입, 주문, 마이페이지 등)

---
**막히면 참고**: `DESIGN_SYSTEM.md`(스타일 규칙), `../docs/API_명세_초안.md`(엔드포인트 계약)
