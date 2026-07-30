import { useState, type FormEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { updateProfile } from "../../api/auth";
import { WebAuthLayout } from "../components/WebAuthLayout";
import styles from "./WebAuthPages.module.css";

export function WebAddPhonePage() {
    const [phone1, setPhone1] = useState("010");
    const [phone2, setPhone2] = useState("");
    const [phone3, setPhone3] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const phone3Ref = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

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

        try {
            setSubmitting(true);
            await updateProfile({ phone: phoneFull });
            window.alert("연락처 등록이 완료되었습니다. 반갑습니다!");
            navigate("/web");
        } catch (err: unknown) {
            let msg = "연락처 등록에 실패했습니다. 다시 시도해 주세요.";
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                msg = err.response.data.message;
            }
            window.alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <WebAuthLayout
            eyebrow="ADDITIONAL INFO"
            title="마지막 가입 단계를 완료하세요"
            description="안전한 배송 추적 및 중요 서비스 안내 수신을 위해 연락처 등록이 필요합니다."
        >
            <div className={styles.heading}>
                <h2>추가 정보 입력</h2>
                <p>배송 시 연락할 휴대폰 번호를 정확하게 입력해 주세요.</p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                    <label>휴대폰 번호</label>
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
                        <span style={{ color: "#aaa" }}>-</span>
                        <input
                            type="tel"
                            maxLength={4}
                            value={phone2}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                setPhone2(val);
                                if (val.length === 4 && phone3Ref.current) {
                                    phone3Ref.current.focus();
                                }
                            }}
                            placeholder="1234"
                            style={{
                                flex: 1.2,
                                padding: "12px",
                                border: "1px solid var(--color-border, #ddd)",
                                borderRadius: "8px",
                                background: "var(--color-bg-card, #fff)",
                                color: "var(--color-text, #333)",
                                fontSize: "14px",
                                outline: "none",
                                height: "45px",
                                textAlign: "center"
                            }}
                        />
                        <span style={{ color: "#aaa" }}>-</span>
                        <input
                            type="tel"
                            ref={phone3Ref}
                            maxLength={4}
                            value={phone3}
                            onChange={(e) => setPhone3(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="5678"
                            style={{
                                flex: 1.2,
                                padding: "12px",
                                border: "1px solid var(--color-border, #ddd)",
                                borderRadius: "8px",
                                background: "var(--color-bg-card, #fff)",
                                color: "var(--color-text, #333)",
                                fontSize: "14px",
                                outline: "none",
                                height: "45px",
                                textAlign: "center"
                            }}
                        />
                    </div>
                </div>

                <button type="submit" className={styles.button} disabled={submitting} style={{ marginTop: "20px" }}>
                    {submitting ? "등록 중..." : "등록 완료"}
                </button>
            </form>
        </WebAuthLayout>
    );
}
