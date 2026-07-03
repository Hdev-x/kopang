import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { login as authLogin } from "../../lib/auth";
import styles from "./AdminLoginPage.module.css";

export function AdminLoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 목업: 입력값 무관하게 관리자(role=ADMIN)로 로그인 처리 후 대시보드 이동.
  // 백엔드 붙이면 이 자리에 실제 관리자 인증이 들어감.
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    authLogin({ name: "관리자", role: "ADMIN" });
    navigate("/admin");
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <ShieldCheck size={26} />
          <span>KOPANG 관리자</span>
        </div>
        <p className={styles.sub}>관리자 전용 콘솔</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="관리자 ID"
            placeholder="admin@kopang.com"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className={styles.submit}>
            관리자 로그인
          </Button>
        </form>

        <p className={styles.demo}>⚠️ 목업 — 아무 값이나 입력해도 관리자로 진입합니다</p>
        <Link to="/" className={styles.back}>← 회원 사이트로</Link>
      </div>
    </div>
  );
}
