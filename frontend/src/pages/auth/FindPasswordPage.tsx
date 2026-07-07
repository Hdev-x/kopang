import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { sendVerificationCode, resetPassword } from "../../api/auth";
import styles from "../../styles/LoginPage.module.css";
export function FindPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);
    // 1. 인증번호 발송 요청
    const handleSendCode = async (e: FormEvent) => {
        e.preventDefault();
        if (!email) {
            alert("이메일을 입력해 주세요.");
            return;
        }
        setLoading(true);
        try {
            await sendVerificationCode(email);
            alert("인증번호가 이메일로 발송되었습니다. (테스트용 번호: 123456)");
            setCodeSent(true);
        } catch (err: any) {
            alert(err.response?.data?.message || "가입되지 않은 이메일입니다.");
        } finally {
            setLoading(false);
        }
    };
    // 2. 비밀번호 재설정 요청
    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!code || !newPassword) {
            alert("인증번호와 새 비밀번호를 모두 입력해 주세요.");
            return;
        }
        setLoading(true);
        try {
            await resetPassword({
                email,
                code,
                newPassword
            });
            alert("비밀번호가 재설정되었습니다. 새로운 비밀번호로 로그인해 주세요.");
            navigate("/login");
        } catch (err: any) {
            alert(err.response?.data?.message || "인증번호가 올바르지 않거나 변경에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <Layout>
            <PageHeader />
            <div className={styles.wrap}>
                <h1 className={styles.title}>비밀번호 찾기</h1>

                {!codeSent ? (
                    <form className={styles.form} onSubmit={handleSendCode}>
                        <p className={styles.switch} style={{ textAlign: "left", marginBottom: "15px", color: "var(--color-text-muted)" }}>
                            가입하신 이메일 주소를 입력하시면 비밀번호를 재설정할 수 있는 인증번호가 전송됩니다.
                        </p>
                        <Input
                            label="이메일"
                            type="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button type="submit" className={styles.submit} disabled={loading}>
                            {loading ? "전송 중..." : "인증번호 발송"}
                        </Button>
                    </form>
                ) : (
                    <form className={styles.form} onSubmit={handleResetPassword}>
                        <p className={styles.switch} style={{ textAlign: "left", marginBottom: "15px", color: "var(--color-text-muted)" }}>
                            이메일로 발송된 6자리 인증번호와 새로 변경할 비밀번호를 입력해 주세요.
                        </p>
                        <Input
                            label="인증번호"
                            type="text"
                            placeholder="인증번호 6자리 입력 (예: 123456)"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <Input
                            label="새 비밀번호"
                            type="password"
                            placeholder="변경할 새 비밀번호 입력"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Button type="submit" className={styles.submit} disabled={loading}>
                            {loading ? "변경 중..." : "비밀번호 변경하기"}
                        </Button>
                    </form>
                )}
                <p className={styles.switch} style={{ marginTop: "20px" }}>
                    로그인 화면으로 돌아가시겠습니까? <Link to="/login">로그인</Link>
                </p>
            </div>
        </Layout>
    );
}
