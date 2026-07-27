import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { updateProfile } from "../../api/auth";
import styles from "../../styles/LoginPage.module.css";

export function AddPhonePage() {
    const [phone1, setPhone1] = useState("010");
    const [phone2, setPhone2] = useState("");
    const [phone3, setPhone3] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const phoneFull = `${phone1}-${phone2}-${phone3}`;
        const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;

        if (!phone2 || !phone3) {
            alert("연락처를 끝까지 입력해 주세요.");
            return;
        }
        if (!phoneRegex.test(phoneFull)) {
            alert("올바른 휴대폰 번호 형식이 아닙니다.");
            return;
        }

        try {
            setSubmitting(true);
            await updateProfile({ phone: phoneFull });
            alert("연락처 등록이 완료되었습니다. 반갑습니다!");
            navigate("/");
        } catch (err: any) {
            const msg = err.response?.data?.message || "연락처 등록에 실패했습니다. 다시 시도해 주세요.";
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <PageHeader />
            <div className={styles.wrap} style={{ marginTop: "40px" }}>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <span style={{ fontSize: "24px" }}>🎉</span>
                    <h1 className={styles.title} style={{ marginTop: "10px", marginBottom: "8px" }}>추가 정보 입력</h1>
                    <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.5" }}>
                        소셜 로그인 가입을 축하드립니다!<br />
                        안전한 배송 및 알림 수신을 위해 연락처를 등록해 주세요.
                    </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginBottom: "25px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text, #333)" }}>휴대폰 번호</span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
                            <select
                                value={phone1}
                                onChange={(e) => setPhone1(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    border: "1px solid var(--color-border, #ddd)",
                                    borderRadius: "8px",
                                    background: "#fff",
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
                            <span style={{ color: "#aaa" }}>-</span>
                            <input
                                type="tel"
                                maxLength={4}
                                value={phone2}
                                onChange={(e) => setPhone2(e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder="1234"
                                style={{
                                    flex: 1.2,
                                    padding: "12px",
                                    border: "1px solid var(--color-border, #ddd)",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    outline: "none",
                                    height: "45px",
                                    textAlign: "center"
                                }}
                            />
                            <span style={{ color: "#aaa" }}>-</span>
                            <input
                                type="tel"
                                maxLength={4}
                                value={phone3}
                                onChange={(e) => setPhone3(e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder="5678"
                                style={{
                                    flex: 1.2,
                                    padding: "12px",
                                    border: "1px solid var(--color-border, #ddd)",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    outline: "none",
                                    height: "45px",
                                    textAlign: "center"
                                }}
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={submitting} style={{ width: "100%", height: "48px", fontSize: "16px" }}>
                        {submitting ? "등록 중..." : "등록 완료"}
                    </Button>
                </form>
            </div>
        </Layout>
    );
}
