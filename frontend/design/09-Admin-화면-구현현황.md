# Admin 화면 구현 현황

> 기준: 2026-07-22 `feature/fe-web-design`
> 원칙: Admin은 사용자 Web·Mobile과 별도의 운영 화면으로 관리한다.

## 1. 공통 구조

- [x] 데스크톱 고정 sidebar
- [x] 공통 topbar와 관리자 profile 영역
- [x] 900px 이하 drawer navigation
- [x] Commerce·Customer·Retention·Content 메뉴 분리
- [x] 사용자 Web 바로가기
- [x] 통합 대시보드 UI

공통 shell은 `AdminLayout`이 담당하며 `/admin/*` 페이지에 일괄 적용된다. 사용자용 `WebLayout`, Mobile `Layout`과 component를 섞지 않는다.

## 2. 현재 API를 사용하는 관리 화면

- [x] 상품 목록·등록·수정·삭제·이미지 업로드
- [x] 주문 목록·배송 상태 변경
- [x] 회원 목록
- [x] 멤버십 현황
- [x] 쿠폰 목록·등록
- [x] FAQ 목록·등록·수정·삭제

위 항목은 기존 API 함수를 유지한 채 Admin 공통 layout만 교체했다. 실제 사용 가능 여부는 로그인 권한과 Backend 실행 상태에도 영향을 받는다.

## 3. 추가 Backend·ML 작업이 필요한 영역

- [ ] 통합 대시보드 매출·주문·신규 회원 집계 API
- [ ] 대시보드 최근 주문 API 연결
- [ ] 이탈 위험 점수와 위험군 분포 ML 연동
- [ ] 위험 고객 목록 API
- [ ] 이탈 대응 이력과 효과 리포트 집계 API
- [ ] 관리자 통합 검색
- [ ] 관리자 알림

현재 통합 대시보드의 요약 수치와 차트는 화면 구조 확인용 `DEMO` 데이터다. 실제 데이터처럼 오해하지 않도록 화면에 표시한다.

## 4. 작업 규칙

- Admin 화면은 데스크톱 운영 효율을 우선한다.
- 색상·font family·semantic state는 공통 디자인 토큰을 사용한다.
- API·type·인증 규칙은 기존 코드를 공유하고 화면 안에서 복제하지 않는다.
- 새 관리 기능을 추가할 때 sidebar 분류와 route를 함께 갱신한다.
- 집계값은 화면에서 계산하지 않고 Backend 집계 API의 응답을 사용한다.
