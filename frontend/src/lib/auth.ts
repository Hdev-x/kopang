// 목업용 "로그인한 척" 상태. 실제 인증 아님 — LocalStorage 플래그 + 화면 갱신 이벤트.
// 백엔드 붙이면 이 자리에 실제 토큰/유저가 들어감.
const KEY = "kopang_auth";

export type AuthUser = { name: string; email?: string; role?: "USER" | "ADMIN" };

export function getAuth(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getAuth() !== null;
}

export function isAdmin(): boolean {
  const role = getAuth()?.role;
  return role === "ADMIN" || role === "ROLE_ADMIN";
}

export function login(user: AuthUser, accessToken?: string, refreshToken?: string, rememberMe?: boolean): void {
  if (rememberMe) {
    localStorage.setItem(KEY, JSON.stringify(user));
  } else {
    sessionStorage.setItem(KEY, JSON.stringify(user));
  }

  if (accessToken) {
    if (rememberMe) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      sessionStorage.setItem("accessToken", accessToken);
    }
  }
  if (refreshToken) {
    if (rememberMe) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      sessionStorage.setItem("refreshToken", refreshToken);
    }
  }
  window.dispatchEvent(new Event("auth-change"));
}

export function updateAuthUser(partial: Partial<AuthUser>): void {
  const current = getAuth();
  if (!current) return;
  const updated = { ...current, ...partial };
  if (localStorage.getItem(KEY)) {
    localStorage.setItem(KEY, JSON.stringify(updated));
  }
  if (sessionStorage.getItem(KEY)) {
    sessionStorage.setItem(KEY, JSON.stringify(updated));
  }
  window.dispatchEvent(new Event("auth-change"));
}

export function logout(): void {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY);
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.dispatchEvent(new Event("auth-change"));
}
