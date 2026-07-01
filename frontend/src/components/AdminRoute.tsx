import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// 목업 권한 가드: role=ADMIN 아니면 관리자 로그인으로 보냄.
// ⚠️ 진짜 차단은 백엔드(Spring Security, /api/admin/** = ADMIN). 이건 화면 편의용.
export function AdminRoute({ children }: { children: ReactNode }) {
  const user = useAuth();
  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
