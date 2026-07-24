import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login as authLogin, type AuthUser } from "../../lib/auth";

export function OAuth2CallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const nameRaw = searchParams.get("name");
        const roleParam = searchParams.get("role");
        const role: AuthUser["role"] = roleParam === "ADMIN" ? "ADMIN" : "USER";

        if (accessToken && refreshToken && nameRaw) {
            const name = decodeURIComponent(nameRaw);
            // 자체 세션 스토리지에 로그인 정보 저장
            authLogin({ name, role }, accessToken, refreshToken);
            alert(`${name}님, 소셜 로그인으로 반갑습니다!`);
            const preferredView = localStorage.getItem("kopang_login_view");
            localStorage.removeItem("kopang_login_view");
            navigate(preferredView === "web" ? "/web" : "/");
        } else {
            alert("소셜 로그인 인증에 실패했습니다.");
            navigate("/login");
        }
    }, [searchParams, navigate]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            color: "var(--color-text-muted)"
        }}>
            <h2>소셜 로그인 완료 처리 중...</h2>
            <p>잠시만 기다려 주세요.</p>
        </div>
    );
}
