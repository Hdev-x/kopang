import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../../api/auth";
import { login as saveAuth } from "../../lib/auth";
import { WebAuthLayout } from "../components/WebAuthLayout";
import styles from "./WebAuthPages.module.css";

export function WebLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (email !== "admin" && !email.includes("@")) {
      window.alert("올바른 이메일을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiLogin(email, password);
      saveAuth({ name: data.user.name, role: data.user.role }, data.accessToken, data.refreshToken, rememberMe);
      navigate("/web");
    } catch {
      window.alert("로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const rememberWebOAuth = () => localStorage.setItem("kopang_login_view", "web");

  return (
    <WebAuthLayout eyebrow="WELCOME BACK" title="다시 만나서 반가워요" description="로그인하고 장바구니, 주문 내역, 찜한 상품을 Web 화면에서 이어서 확인하세요.">
      <div className={styles.heading}><h2>로그인</h2><p>Kopang 계정 정보를 입력해 주세요.</p></div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}><label htmlFor="web-login-email">이메일</label><input id="web-login-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" autoComplete="email" /></div>
        <div className={styles.field}><label htmlFor="web-login-password">비밀번호</label><input id="web-login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호 입력" autoComplete="current-password" /></div>
        <div className={styles.formOptions}>
          <label className={styles.remember}><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />자동 로그인</label>
          <Link to="/web/find-password">비밀번호 찾기</Link>
        </div>
        <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? "로그인 중..." : "로그인"}</button>
      </form>
      <div className={styles.divider}>또는 소셜 계정으로 로그인</div>
      <div className={styles.socials}>
        <a className={styles.google} href="http://localhost:8080/oauth2/authorization/google" onClick={rememberWebOAuth}>Google 계정으로 로그인</a>
        <a className={styles.naver} href="http://localhost:8080/oauth2/authorization/naver" onClick={rememberWebOAuth}>Naver 계정으로 로그인</a>
      </div>
      <p className={styles.switch}><span>아직 회원이 아니신가요?</span><Link to="/web/signup">회원가입</Link></p>
    </WebAuthLayout>
  );
}
