import { useState, type FormEvent } from "react";
import { Layout } from "../components/Layout";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import styles from "./LoginPage.module.css";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: POST /api/auth/signup
  };

  return (
    <Layout>
      <h1>회원가입</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">가입하기</Button>
      </form>
    </Layout>
  );
}
