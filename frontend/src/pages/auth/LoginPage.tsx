import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { login as apiLogin } from "../../api/auth";
import { login as authLogin } from "../../lib/auth";
import styles from "../../styles/LoginPage.module.css";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 일반 회원은 이메일 형식(@ 포함)을 필수로 제한하되, 'admin' 관리자 아이디만 예외 허용
    if (email !== "admin" && !email.includes("@")) {
      alert("올바른 이메일 형식(@ 포함)을 입력해 주세요.");
      return;
    }

    try {
      const data = await apiLogin(email, password);
      // 실제 로그인 정보 저장 (이름, 권한, 토큰, 자동로그인 여부)
      authLogin(
        { name: data.user.name, role: data.user.role },
        data.accessToken,
        data.refreshToken,
        rememberMe
      );
      navigate("/");
    } catch (err: any) {
      alert("로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해 주세요.");
    }
  };

  return (
    <Layout>
      <PageHeader />
      <div className={styles.wrap}>
        <h1 className={styles.title}>로그인</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="이메일"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div style={{ position: "relative", width: "100%", marginBottom: "15px" }}>
            <Input
              label="비밀번호"
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                bottom: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                color: "#888",
                zIndex: 2,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer", color: "var(--color-text)" }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              자동 로그인
            </label>
          </div>
          <Button type="submit" className={styles.submit}>
            로그인
          </Button>
        </form>
        <p className={styles.switch}>
          아직 회원이 아니신가요? <Link to="/signup">회원가입</Link> | <Link to="/find-email">아이디 찾기</Link> | <Link to="/find-password">비밀번호 찾기</Link>
        </p>

        <div style={{ display: "flex", alignItems: "center", margin: "20px 0", color: "var(--color-text-muted, #888)" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border, #eee)" }}></div>
          <span style={{ padding: "0 10px", fontSize: "var(--font-xs, 12px)" }}>또는 소셜 계정으로 로그인</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border, #eee)" }}></div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          <a
            href="/oauth2/authorization/google"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "45px",
              borderRadius: "var(--radius-md, 8px)",
              border: "1px solid var(--color-border, #eee)",
              backgroundColor: "#ffffff",
              color: "#333333",
              textDecoration: "none",
              fontWeight: "var(--weight-medium, 500)",
              fontSize: "var(--font-sm, 14px)",
              cursor: "pointer"
            }}
          >
            Google 계정으로 로그인
          </a>
          <a
            href="/oauth2/authorization/naver"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "45px",
              borderRadius: "var(--radius-md, 8px)",
              backgroundColor: "#03C75A",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: "var(--weight-medium, 500)",
              fontSize: "var(--font-sm, 14px)",
              cursor: "pointer"
            }}
          >
            Naver 계정으로 로그인
          </a>
        </div>
      </div>
    </Layout>
  );
}

