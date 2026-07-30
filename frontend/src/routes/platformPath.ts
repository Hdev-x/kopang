// 웹(/web/*)과 모바일(/*) 라우트는 접두사만 다르다 — /web/products/12 ↔ /products/12.
// 화면 전환 버튼이 지금 보던 페이지의 반대편으로 가도록 경로를 계산한다.
// 규칙에서 벗어나는 두 가지만 아래에 표로 둔다.

/** 고객센터만 위치가 다르다. 웹은 최상위, 모바일은 마이페이지 아래. */
const SUPPORT_WEB = "/web/support";
const SUPPORT_MOBILE = "/my/support";

/** 모바일에 대응 화면이 없는 웹 경로. 마이페이지로 보낸다. */
const WEB_ONLY = ["/web/my/notifications", "/web/my/password", "/web/my/reviews"];

function startsWithPath(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** 지금 보고 있는 웹 경로에 대응하는 모바일 경로. */
export function toMobilePath(pathname: string, search = ""): string {
  if (WEB_ONLY.some((base) => startsWithPath(pathname, base))) return "/my";
  if (startsWithPath(pathname, SUPPORT_WEB)) {
    return SUPPORT_MOBILE + pathname.slice(SUPPORT_WEB.length) + search;
  }
  if (pathname === "/web") return "/";
  if (pathname.startsWith("/web/")) return pathname.slice("/web".length) + search;
  return "/";
}

/** 지금 보고 있는 모바일 경로에 대응하는 웹 경로. */
export function toWebPath(pathname: string, search = ""): string {
  if (startsWithPath(pathname, SUPPORT_MOBILE)) {
    return SUPPORT_WEB + pathname.slice(SUPPORT_MOBILE.length) + search;
  }
  // 관리자 화면에는 웹/모바일 구분이 없다. 전환 버튼도 없지만 방어적으로 홈을 준다.
  if (pathname === "/" || pathname === "/mobile" || pathname.startsWith("/admin")) return "/web";
  if (pathname.startsWith("/web")) return pathname + search;
  return "/web" + pathname + search;
}
