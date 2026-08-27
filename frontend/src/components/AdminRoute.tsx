import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { isAdmin } from "../lib/auth";

// 권한 가드: role=ADMIN / ROLE_ADMIN 이 아니면 로그인으로 보냄.
export function AdminRoute({ children }: { children: ReactNode }) {
  const user = useAuth();
  if (!user || !isAdmin()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
