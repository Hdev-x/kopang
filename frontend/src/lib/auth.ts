// 목업용 "로그인한 척" 상태. 실제 인증 아님 — LocalStorage 플래그 + 화면 갱신 이벤트.
// 백엔드 붙이면 이 자리에 실제 토큰/유저가 들어감.
const KEY = "kopang_auth";

export type AuthUser = { name: string; role?: "USER" | "ADMIN" };

export function getAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getAuth() !== null;
}

export function isAdmin(): boolean {
  return getAuth()?.role === "ADMIN";
}

export function login(user: AuthUser, accessToken?: string, refreshToken?: string): void {
  localStorage.setItem(KEY, JSON.stringify(user));
  if (accessToken) {
    sessionStorage.setItem("accessToken", accessToken);
  }
  if (refreshToken) {
    sessionStorage.setItem("refreshToken", refreshToken);
  }
  window.dispatchEvent(new Event("auth-change"));
}


export function logout(): void {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("auth-change"));
}
