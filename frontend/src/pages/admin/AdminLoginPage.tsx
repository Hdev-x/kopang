import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { login as apiLogin } from "../../api/auth";
import { login as authLogin } from "../../lib/auth";
import styles from "./AdminLoginPage.module.css";

export function AdminLoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await apiLogin(id, password);
      if (res.user.role !== "ADMIN") {
        setError("관리자 권한이 없는 계정입니다.");
        return;
      }
      authLogin(
        { name: res.user.name, role: res.user.role },
        res.accessToken,
        res.refreshToken
      );
      navigate("/admin");
    } catch (err: any) {
      setError(err.response?.data?.message || "로그인에 실패했습니다.");
      console.error(err);
    }
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

        {error && <p className={styles.error}>{error}</p>}
        <p className={styles.demo}>⚠️ 실제 관리자 계정으로 로그인해야 데이터를 불러올 수 있습니다.</p>
        <Link to="/" className={styles.back}>← 회원 사이트로</Link>
      </div>
    </div>
  );
}
