import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { findEmail } from "../../api/auth";
import { WebAuthLayout } from "../components/WebAuthLayout";
import styles from "./WebAuthPages.module.css";

export function WebFindEmailPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [phone1, setPhone1] = useState("010");
    const [phone2, setPhone2] = useState("");
    const [phone3, setPhone3] = useState("");
    const [foundEmail, setFoundEmail] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!name.trim()) {
            window.alert("이름을 입력해 주세요.");
            return;
        }
        const phoneFull = `${phone1}-${phone2}-${phone3}`;
        const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
        if (!phone2 || !phone3) {
            window.alert("연락처를 끝까지 입력해 주세요.");
            return;
        }
        if (!phoneRegex.test(phoneFull)) {
            window.alert("올바른 휴대폰 번호 형식이 아닙니다.");
            return;
        }
        setSubmitting(true);
        try {
            const data = await findEmail(name, phoneFull);
            setFoundEmail(data.email);
        } catch (err: any) {
            const msg = err.response?.data?.message || "일치하는 회원 정보가 없습니다.";
            window.alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <WebAuthLayout eyebrow="ACCOUNT RECOVERY" title="가입하신 이메일 아이디를 잊으셨나요?" description="이름과 연락처를 입력하시면 가입된 이메일 주소의 일부를 마스킹하여 안내해 드립니다.">
            <div className={styles.heading}><h2>아이디 찾기</h2><p>{foundEmail ? "조회된 이메일 주소입니다." : "이름과 연락처를 입력해 주세요."}</p></div>

            {!foundEmail ? (
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label htmlFor="web-find-name">이름</label>
                        <input
                            id="web-find-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="이름 입력"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>연락처</label>
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
                                placeholder="중간"
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
                                required
                            />
                            <span style={{ color: "var(--color-text-muted, #888)" }}>-</span>
                            <input
                                type="text"
                                maxLength={4}
                                value={phone3}
                                onChange={(e) => setPhone3(e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder="끝자리"
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
                                required
                            />
                        </div>
                    </div>

                    <button className={styles.submit} type="submit" disabled={submitting}>
                        {submitting ? "조회 중..." : "아이디 찾기"}
                    </button>
                </form>
            ) : (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <div
                        style={{
                            backgroundColor: "#f5f9ff",
                            border: "1px solid #cce0ff",
                            borderRadius: "8px",
                            padding: "20px",
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#0056b3",
                            marginBottom: "25px",
                            textAlign: "center"
                        }}
                    >
                        {foundEmail}
                    </div>

                    <button
                        className={styles.submit}
                        type="button"
                        onClick={() => navigate("/web/login")}
                        style={{ marginBottom: "15px" }}
                    >
                        로그인하러 가기
                    </button>

                    <Link
                        to="/web/find-password"
                        style={{
                            color: "#777",
                            fontSize: "14px",
                            textDecoration: "underline",
                            display: "inline-block",
                            marginTop: "5px"
                        }}
                    >
                        비밀번호 찾기로 이동할까요?
                    </Link>
                </div>
            )}

            <p className={styles.switch}><span>로그인 화면으로 돌아갈까요?</span><Link to="/web/login">로그인</Link></p>
        </WebAuthLayout>
    );
}
