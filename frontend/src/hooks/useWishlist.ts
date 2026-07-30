import { useSyncExternalStore } from "react";
import { addWishlist, deleteWishlist, getWishlist } from "../api/wishlist";
import { getAuth } from "../lib/auth";

// 찜 여부를 카드마다 조회하면 목록 화면에서 상품 수만큼 요청이 나간다(상품 20개 = 요청 20건).
// 찜 목록은 한 번에 받아올 수 있으므로 모듈 단위로 1회만 조회하고 화면들이 그 결과를 공유한다.
// 갱신은 구독자에게 알려 퍼뜨린다 — 상세에서 찜하면 목록 카드의 하트도 함께 바뀐다.

const EMPTY: ReadonlySet<number> = new Set();

let cache: ReadonlySet<number> | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function load(): Promise<void> {
  if (inflight) return inflight;
  inflight = getWishlist()
    .then((items) => {
      cache = new Set(items.map((item) => item.productId));
    })
    .catch(() => {
      // 조회 실패는 "찜한 게 없다"로 보고 화면을 막지 않는다.
      cache = EMPTY;
    })
    .finally(() => {
      inflight = null;
      notify();
    });
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // 첫 구독자가 로딩을 유발한다. effect 안에서 setState를 부르지 않아도 되고 중복 요청도 없다.
  if (cache === null && getAuth()) void load();
  return () => {
    listeners.delete(listener);
  };
}

// snapshot은 참조가 바뀌어야 React가 갱신을 감지한다. 아래 toggle에서 Set을 새로 만드는 이유다.
function getSnapshot(): ReadonlySet<number> {
  return cache ?? EMPTY;
}

/** 로그인·로그아웃 시 다른 사용자의 찜이 남지 않도록 비운다. */
export function resetWishlistCache() {
  cache = null;
  inflight = null;
  notify();
}

window.addEventListener("auth-change", resetWishlistCache);

export function useWishlist() {
  const wishedIds = useSyncExternalStore(subscribe, getSnapshot);

  /** 찜 상태를 뒤집고 바뀐 결과를 반환한다. 실패하면 예외를 그대로 올린다. */
  const toggleWishlist = async (productId: number) => {
    const wished = (cache ?? EMPTY).has(productId);
    if (wished) await deleteWishlist(productId);
    else await addWishlist(productId);

    const next = new Set(cache ?? EMPTY);
    if (wished) next.delete(productId);
    else next.add(productId);
    cache = next;
    notify();

    return !wished;
  };

  return {
    isWished: (productId: number) => wishedIds.has(productId),
    toggleWishlist,
  };
}
