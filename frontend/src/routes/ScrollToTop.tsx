import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 페이지를 옮기면 스크롤을 맨 위로 되돌린다.
 *
 * 쓰는 이유: SPA는 이동해도 브라우저가 스크롤을 그대로 둔다.
 * 목록 아래쪽에서 상품을 누르면 상세 페이지가 중간부터 보이는 일이 생긴다.
 *
 * 두 가지는 건드리지 않는다.
 * - 해시가 있는 이동(`/web/products/1#review`) — 그 위치로 가려는 의도다
 * - 같은 경로에서 쿼리만 바뀌는 경우(정렬·필터·페이지) — 보던 자리를 유지한다
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
