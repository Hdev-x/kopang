# Kopang Web·Mobile 디자인 작업 문서

> 상태: 팀 합의 전 제안안
> 목적: 기존 mobile UI를 보존하면서 web UI를 별도로 제작하고, 공통 브랜드 규칙과 작업 경계를 관리한다.

## 이 폴더의 역할

이 폴더는 디자인 결과물 자체보다 다음 내용을 관리한다.

- mobile·web·admin 화면의 책임 경계
- 공통 Foundation과 영역별 UI 규칙
- 기존 mobile 구조의 이관 방법
- 화면 상태와 검증 기준
- 팀원이 전달할 디자인 링크와 결정 이력

실제 코드의 최종 값은 아래 파일을 정본으로 둔다.

- 디자인 토큰: `src/styles/tokens.css`
- 현재 전체 디자인 규칙: `DESIGN_SYSTEM.md`
- API 계약: 프로젝트 공식 API 명세

이 폴더의 제안이 기존 코드 또는 팀 공식 문서와 충돌하면 팀 합의 후 정본을 수정한다.

## 문서 순서

1. [01-목표-구조.md](./01-목표-구조.md)
2. [02-디자인-규칙.md](./02-디자인-규칙.md)
3. [03-이관-계획.md](./03-이관-계획.md)
4. [04-화면-검증-기준.md](./04-화면-검증-기준.md)
5. [05-디자인-링크와-결정.md](./05-디자인-링크와-결정.md)
6. [06-Web-레퍼런스와-QuickBar.md](./06-Web-레퍼런스와-QuickBar.md)
7. [07-Web-화면-구현현황.md](./07-Web-화면-구현현황.md)
8. [08-Web-홈-기능연결현황.md](./08-Web-홈-기능연결현황.md)

## 현재 합의 방향

- 기존 사용자 화면은 mobile 기준 구현으로 본다.
- mobile UI 내부 JSX·CSS·기능은 초기 이관에서 변경하지 않는다.
- web UI는 mobile과 별도의 page·layout·표현 component·CSS로 제작한다.
- API·type·인증·업무 규칙은 mobile과 web이 공유한다.
- admin은 사용자 mobile·web과 다른 독립 영역으로 유지한다.
- 브랜드 색·font family·icon 계열·semantic state는 세 영역이 공유한다.
- 구체적인 크기·배치·navigation·interaction은 영역별 규칙을 따른다.

## 아직 결정되지 않은 항목

- `/mobile/*`, `/web/*` URL을 실제 서비스 경로로 사용할지
- 기존 `/` 경로의 기본 이동 방식
- 최초 기기 감지 기준과 수동 전환 저장 방식
- web 기준 너비·grid
- 공통 component의 최종 소유자
- 팀원이 전달할 디자인 원본과 링크
