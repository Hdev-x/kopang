import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiLogin(email, password);
      // 실제 로그인 정보 저장 (이름, 권한, 토큰)
      authLogin(
        { name: data.user.name, role: data.user.role },
        data.accessToken,
        data.refreshToken
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
