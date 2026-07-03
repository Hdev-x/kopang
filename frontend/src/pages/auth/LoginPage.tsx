import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { login as apiLogin } from "../api/auth";
import { login as authLogin } from "../lib/auth";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // 목업: MSW 가짜 로그인 시도 → 성공/실패 무관하게 로그인 상태로 처리하고 홈 이동
    try {
      const data = await apiLogin(email, password);
      authLogin({ name: data.user.name });
    } catch {
      authLogin({ name: "홍길동" });
    }
    navigate("/");
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
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className={styles.submit}>
            로그인
          </Button>
        </form>
        <p className={styles.switch}>
          아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
        </p>

        <div className={styles.adminEntry}>
          <Link to="/admin/login" className={styles.adminLink}>
            관리자 로그인
          </Link>
        </div>
      </div>
    </Layout>
  );
}
