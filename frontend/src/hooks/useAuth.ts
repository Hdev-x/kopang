import { useEffect, useState } from "react";
import { getAuth, type AuthUser } from "../lib/auth";

// 로그인 상태를 구독하는 훅. auth-change(같은 탭)·storage(다른 탭) 이벤트로 갱신.
export function useAuth(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(getAuth);

  useEffect(() => {
    const sync = () => setUser(getAuth());
    window.addEventListener("auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return user;
}
