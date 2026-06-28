# Copang 디자인 시스템 룰

> 목적: **일관성 유지 + 바이브코딩 가드레일.**
> 모든 화면/컴포넌트는 이 룰 안에서 만든다. (AI에게 시킬 때도 이 문서를 기준으로)
> 전제: **모바일 퍼스트**, CSS Modules(컴포넌트) + 전역 CSS(토큰) 조합.

---

## 0. 핵심 원칙 (어기지 말 것)
1. **하드코딩 금지** — 색/간격/폰트는 *반드시 토큰(`var(--...)`)*. `#fff`, `16px` 직접 쓰지 않기 (예외: 0, 1px 보더 등 자명한 값)
2. **토큰 → 컴포넌트 → 페이지** 순으로 쌓는다. 페이지에서 스타일 떡칠 X, 컴포넌트를 조립
3. **공통 컴포넌트 우선** — 버튼/카드/인풋은 새로 만들지 말고 기존 것 사용
4. **모바일 퍼스트** — 기본은 모바일, 큰 화면은 미디어쿼리로 *확장*

---

## 1. 디자인 토큰 (`src/styles/tokens.css`)
이 값이 **단일 진실(single source).** 바꾸려면 여기서만.

```css
:root {
  /* ===== 색: 브랜드 ===== */
  --color-primary: #3b5bff;
  --color-primary-hover: #2f49cc;
  --color-primary-light: #eaeeff;

  /* ===== 색: 중립(그레이 스케일) ===== */
  --gray-50:  #f8f9fa;
  --gray-100: #f1f3f5;
  --gray-200: #e9ecef;
  --gray-300: #dee2e6;
  --gray-500: #868e96;
  --gray-700: #495057;
  --gray-900: #212529;

  /* ===== 색: 의미(semantic) ===== */
  --color-bg:        #ffffff;   /* 페이지 배경 */
  --color-surface:   #ffffff;   /* 카드 등 표면 */
  --color-text:      var(--gray-900);
  --color-text-muted:var(--gray-500);
  --color-border:    var(--gray-200);

  /* ===== 색: 상태 ===== */
  --color-success: #2f9e44;
  --color-danger:  #e03131;   /* 에러/삭제 */
  --color-sale:    #e03131;   /* 할인가 강조 (쇼핑몰 핵심) */
  --color-warning: #f08c00;

  /* ===== 간격 (4px 베이스) ===== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* ===== 폰트 크기 ===== */
  --font-xs: 12px;
  --font-sm: 14px;
  --font-md: 16px;   /* 기본 본문 */
  --font-lg: 18px;
  --font-xl: 24px;
  --font-2xl: 32px;

  /* ===== 폰트 굵기 ===== */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-bold: 700;

  /* ===== 모서리 ===== */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* ===== 그림자 ===== */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);

  /* ===== 레이아웃 ===== */
  --max-width: 480px;   /* 모바일 퍼스트 본문 최대폭 */

  /* ===== z-index 층 ===== */
  --z-header: 100;
  --z-modal: 1000;
  --z-toast: 2000;
}
```

### 반응형 브레이크포인트 (참고값)
> CSS 변수는 `@media`에 못 써서 **숫자로 약속만** 함.
- 모바일: 기본 (~ 480px)
- 태블릿: `@media (min-width: 768px)`
- 데스크탑: `@media (min-width: 1024px)`

---

## 2. 전역 CSS (`src/styles/global.css`)
```css
@import "./tokens.css";

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--color-text);
  background: var(--color-bg);
  font-size: var(--font-md);
  line-height: 1.5;
}

/* 모바일 퍼스트 본문 컨테이너 */
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-4);
}
```
→ `main.tsx`에서 `import "./styles/global.css";` 한 번만.

---

## 3. 컴포넌트 규칙
- **파일 한 쌍**: `Button.tsx` + `Button.module.css` (같은 폴더/이름)
- **컴포넌트명 PascalCase** (`ProductCard`), **클래스명 camelCase** (`styles.cardTitle`)
- **props는 타입 명시.** 변형은 `variant` prop으로:
```tsx
type Props = {
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  onClick?: () => void;
};
export function Button({ variant = "primary", children, onClick }: Props) {
  return (
    <button className={`${styles.button} ${styles[variant]}`} onClick={onClick}>
      {children}
    </button>
  );
}
```
```css
/* Button.module.css */
.button {
  border: none; border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-md); font-weight: var(--weight-medium);
  cursor: pointer;
}
.primary { background: var(--color-primary); color: #fff; }
.primary:hover { background: var(--color-primary-hover); }
.ghost { background: transparent; color: var(--color-primary); }
```

### 기본 공통 컴포넌트 목록 (먼저 만들 것)
| 컴포넌트 | 용도 |
|---|---|
| `Button` | 버튼 (primary/ghost) |
| `Card` | 카드 컨테이너 (그림자/모서리) |
| `Input` | 입력 필드 (label/error 포함) |
| `Layout` | 헤더 + 본문 컨테이너 |

---

## 4. 네이밍 컨벤션
- 파일: 컴포넌트 = `PascalCase.tsx`, 그 외 = `camelCase.ts`
- 페이지: `XxxPage.tsx` (예: `ProductListPage.tsx`)
- API 함수: 동사+명사 (`getProducts`, `postLogin`)
- CSS 클래스: camelCase (`styles.priceTag`)

---

## 5. 🤖 바이브코딩 규칙 (AI에게 시킬 때)
**그냥 "예쁜 페이지 만들어줘" 금지.** 항상 이 가드레일을 프롬프트에 넣는다:

> "`frontend/DESIGN_SYSTEM.md`의 토큰과 기존 공통 컴포넌트(`Button`, `Card`, `Input`, `Layout`)를 사용해서 [화면] 만들어줘.
> - 색/간격/폰트는 반드시 `var(--토큰)` 사용, 하드코딩 금지
> - 새 컴포넌트 만들지 말고 기존 것 조립
> - 모바일 퍼스트, `.container`로 감싸기
> - 스타일은 `XxxPage.module.css`로 분리"

**체크리스트 (AI 결과 받은 뒤):**
- [ ] 하드코딩된 색/px 없나? (`#`, `px` 직접값 검색)
- [ ] 기존 컴포넌트 재사용했나, 멋대로 새로 만들었나?
- [ ] 모바일 화면(개발자도구로 폭 줄여서)에서 안 깨지나?
- [ ] 다른 페이지랑 톤(간격/버튼/색) 일관적인가?

---

## 6. 하지 말 것 (안티패턴)
- ❌ 컴포넌트/페이지에서 색·px 하드코딩
- ❌ 페이지마다 버튼을 새로 스타일링 (→ 공통 `Button` 써)
- ❌ 전역 CSS에 컴포넌트별 스타일 작성 (→ `.module.css`로)
- ❌ 토큰 없이 AI가 임의 색/간격 쓰게 두기
- ❌ 데스크탑 먼저 짜고 모바일 욱여넣기 (→ 모바일 퍼스트)
