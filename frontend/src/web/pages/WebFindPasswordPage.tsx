import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword, sendVerificationCode } from "../../api/auth";
import { WebAuthLayout } from "../components/WebAuthLayout";
import styles from "./WebAuthPages.module.css";

export function WebFindPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await sendVerificationCode(email);
      setCodeSent(true);
      window.alert("인증번호를 이메일로 발송했습니다.");
    } catch {
      window.alert("가입된 이메일을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword({ email, code, newPassword });
      window.alert("비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.");
      navigate("/web/login");
    } catch {
      window.alert("인증번호를 확인하거나 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WebAuthLayout eyebrow="ACCOUNT RECOVERY" title="계정에 다시 접속할 수 있도록 도와드릴게요" description="가입한 이메일로 인증번호를 받은 뒤 새로운 비밀번호를 설정할 수 있습니다.">
      <div className={styles.heading}><h2>비밀번호 찾기</h2><p>{codeSent ? "인증번호와 새 비밀번호를 입력해 주세요." : "가입할 때 사용한 이메일을 입력해 주세요."}</p></div>
      {!codeSent ? (
        <form className={styles.form} onSubmit={handleSendCode}>
          <div className={styles.field}><label htmlFor="web-find-email">이메일</label><input id="web-find-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" autoComplete="email" required /></div>
          <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? "전송 중..." : "인증번호 발송"}</button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={handleReset}>
          <div className={styles.field}><label htmlFor="web-find-code">인증번호</label><input id="web-find-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="인증번호 6자리" inputMode="numeric" required /></div>
          <div className={styles.field}><label htmlFor="web-find-password">새 비밀번호</label><input id="web-find-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="새 비밀번호 입력" autoComplete="new-password" required /></div>
          <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? "변경 중..." : "비밀번호 변경"}</button>
        </form>
      )}
      <p className={styles.switch}><span>로그인 화면으로 돌아갈까요?</span><Link to="/web/login">로그인</Link></p>
    </WebAuthLayout>
  );
}
