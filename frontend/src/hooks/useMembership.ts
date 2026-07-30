import { useSyncExternalStore } from "react";
import { getMembershipStatus } from "../api/membership";
import { getAuth } from "../lib/auth";

// WebLayout은 페이지마다 개별 렌더돼서 이동할 때마다 언마운트·재마운트된다.
// 멤버십 여부를 컴포넌트 state로 들고 있으면 매번 false로 초기화되고,
// API 응답이 오기 전까지 비회원용 프로모션 배너(48px)가 떴다 사라지며 화면이 밀린다.
// 값을 모듈에 한 번만 담아 두면 두 번째 이동부터는 처음부터 정답을 알고 그린다.

/** undefined = 아직 모름. 이 값일 때는 배너 같은 분기 UI를 그리지 않는다. */
let cache: boolean | undefined;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function load(): Promise<void> {
  if (inflight) return inflight;
  inflight = getMembershipStatus()
    .then((status) => {
      cache = Boolean(status && (status.status === "ACTIVE" || status.status === "CANCELLED"));
    })
    .catch(() => {
      cache = false;
    })
    .finally(() => {
      inflight = null;
      notify();
    });
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (cache === undefined) {
    // 비로그인은 물어볼 것도 없이 비회원이다.
    if (!getAuth()) {
      cache = false;
      queueMicrotask(notify);
    } else {
      void load();
    }
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean | undefined {
  return cache;
}

/** 로그인·로그아웃 시 다른 사용자의 멤버십 상태가 남지 않도록 비운다. */
export function resetMembershipCache() {
  cache = undefined;
  inflight = null;
  notify();
}

window.addEventListener("auth-change", resetMembershipCache);

/** true=멤버십, false=비회원, undefined=조회 전 */
export function useMembership(): boolean | undefined {
  return useSyncExternalStore(subscribe, getSnapshot);
}
