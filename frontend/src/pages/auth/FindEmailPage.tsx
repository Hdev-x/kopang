import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { findEmail } from "../../api/auth";
import styles from "../../styles/LoginPage.module.css";

export function FindEmailPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [phone1, setPhone1] = useState("010");
    const [phone2, setPhone2] = useState("");
    const [phone3, setPhone3] = useState("");
    const [foundEmail, setFoundEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("이름을 입력해 주세요.");
            return;
        }
        const phoneFull = `${phone1}-${phone2}-${phone3}`;
        const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
        if (!phone2 || !phone3) {
            alert("연락처를 모두 입력해 주세요.");
            return;
        }
        if (!phoneRegex.test(phoneFull)) {
            alert("올바른 휴대폰 번호 형식이 아닙니다.");
            return;
        }
        setLoading(true);
        try {
            const data = await findEmail(name, phoneFull);
            setFoundEmail(data.email);
        } catch (err: any) {
            alert(err.response?.data?.message || "일치하는 회원 정보가 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <PageHeader />
            <div className={styles.wrap}>
                <h1 className={styles.title}>아이디 찾기</h1>

                {!foundEmail ? (
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <p className={styles.switch} style={{ textAlign: "left", marginBottom: "15px", color: "var(--color-text-muted)" }}>
                            가입하신 이름과 연락처를 입력하시면 이메일 주소를 조회할 수 있습니다.
                        </p>
                        <Input
                            label="이름"
                            placeholder="이름 입력"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        {/* 연락처 3분할 입력 필드 */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginBottom: "20px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text, #333)" }}>연락처</span>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
                                <select
                                    value={phone1}
                                    onChange={(e) => setPhone1(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        border: "1px solid var(--color-border, #ddd)",
                                        borderRadius: "8px",
                                        background: "var(--color-bg-card, #fff)",
                                        color: "var(--color-text, #333)",
                                        fontSize: "14px",
                                        outline: "none",
                                        height: "45px"
                                    }}
                                >
                                    <option value="010">010</option>
                                    <option value="011">011</option>
                                    <option value="016">016</option>
                                    <option value="017">017</option>
                                    <option value="018">018</option>
                                    <option value="019">019</option>
                                </select>
                                <span style={{ color: "var(--color-text-muted, #888)" }}>-</span>
                                <input
                                    type="text"
                                    maxLength={4}
                                    value={phone2}
                                    onChange={(e) => setPhone2(e.target.value.replace(/[^0-9]/g, ""))}
                                    placeholder="중간 4자리"
                                    style={{
                                        flex: 1.5,
                                        padding: "12px",
                                        border: "1px solid var(--color-border, #ddd)",
                                        borderRadius: "8px",
                                        background: "var(--color-bg-card, #fff)",
                                        color: "var(--color-text, #333)",
                                        fontSize: "14px",
                                        outline: "none",
                                        height: "45px"
                                    }}
                                />
                                <span style={{ color: "var(--color-text-muted, #888)" }}>-</span>
                                <input
                                    type="text"
                                    maxLength={4}
                                    value={phone3}
                                    onChange={(e) => setPhone3(e.target.value.replace(/[^0-9]/g, ""))}
                                    placeholder="끝 4자리"
                                    style={{
                                        flex: 1.5,
                                        padding: "12px",
                                        border: "1px solid var(--color-border, #ddd)",
                                        borderRadius: "8px",
                                        background: "var(--color-bg-card, #fff)",
                                        color: "var(--color-text, #333)",
                                        fontSize: "14px",
                                        outline: "none",
                                        height: "45px"
                                    }}
                                />
                            </div>
                        </div>

                        <Button type="submit" className={styles.submit} disabled={loading}>
                            {loading ? "조회 중..." : "아이디 찾기"}
                        </Button>
                    </form>
                ) : (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <p style={{ fontSize: "16px", color: "var(--color-text-muted)", marginBottom: "20px" }}>
                            회원님의 가입 정보와 일치하는 이메일입니다.
                        </p>
                        <div
                            style={{
                                backgroundColor: "var(--color-bg-card, #f9f9f9)",
                                border: "1px solid var(--color-border, #eee)",
                                borderRadius: "8px",
                                padding: "20px",
                                fontSize: "20px",
                                fontWeight: "bold",
                                color: "var(--color-primary, #007bff)",
                                marginBottom: "30px",
                                letterSpacing: "0.5px"
                            }}
                        >
                            {foundEmail}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <Button onClick={() => navigate("/login")} className={styles.submit}>
                                로그인하러 가기
                            </Button>
                            <Link
                                to="/find-password"
                                style={{
                                    color: "var(--color-text-muted, #888)",
                                    fontSize: "14px",
                                    textDecoration: "underline",
                                    marginTop: "10px",
                                    display: "inline-block"
                                }}
                            >
                                비밀번호를 잊으셨나요? 비밀번호 찾기
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
