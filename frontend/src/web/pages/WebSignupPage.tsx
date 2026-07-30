import { useState, type FormEvent, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { checkEmail, signup } from "../../api/auth";
import { WebAuthLayout } from "../components/WebAuthLayout";
import styles from "./WebAuthPages.module.css";

type Term = "service" | "privacy";

const TERMS: Record<Term, { title: string; body: string }> = {
  service: { title: "서비스 이용약관", body: "본 약관은 Kopang 전자상거래 서비스의 이용 조건과 회원·회사의 권리 및 의무를 정합니다.\n\n현재 문안은 화면 검증용이며 팀의 확정 약관으로 교체해야 합니다." },
  privacy: { title: "개인정보 처리방침", body: "회원가입과 주문 처리를 위해 이메일, 비밀번호, 이름 등 필요한 정보를 수집합니다.\n\n현재 문안은 화면 검증용이며 팀의 확정 개인정보 처리방침으로 교체해야 합니다." },
};

export function WebSignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone1, setPhone1] = useState("010");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const phone3Ref = useRef<HTMLInputElement>(null);

  const [checkedEmail, setCheckedEmail] = useState("");
  const [serviceAgreed, setServiceAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [openTerm, setOpenTerm] = useState<Term | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const allAgreed = serviceAgreed && privacyAgreed && marketingAgreed;
  const requiredAgreed = serviceAgreed && privacyAgreed;

  const toggleAll = () => {
    const next = !allAgreed;
    setServiceAgreed(next);
    setPrivacyAgreed(next);
    setMarketingAgreed(next);
  };

  const handleEmailCheck = async () => {
    if (!email.trim() || !email.includes("@")) {
      window.alert("올바른 이메일을 입력해 주세요.");
      return;
    }
    try {
      const result = await checkEmail(email);
      if (result.exists) {
        setCheckedEmail("");
        window.alert("이미 사용 중인 이메일입니다.");
      } else {
        setCheckedEmail(email);
      }
    } catch {
      window.alert("이메일 중복 확인에 실패했습니다.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!checkedEmail || checkedEmail !== email) {
      window.alert("이메일 중복 확인을 진행해 주세요.");
      return;
    }
    if (password.length < 8) {
      window.alert("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      window.alert("비밀번호가 일치하지 않습니다.");
      return;
    }
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

    if (!requiredAgreed) return;

    setSubmitting(true);
    try {
      await signup({
        email,
        password,
        name,
        phone: phoneFull,
        birthDate: birthDate || undefined,
      });
      window.alert("회원가입이 완료되었습니다. 로그인해 주세요.");
      navigate("/web/login");
    } catch (err: unknown) {
      let msg = "회원가입에 실패했습니다. 입력값을 확인해 주세요.";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      window.alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WebAuthLayout eyebrow="JOIN KOPANG" title="새로운 쇼핑 경험을 시작하세요" description="계정을 만들면 주문과 배송, 찜과 알림을 한곳에서 관리할 수 있어요.">
      <div className={styles.heading}><h2>회원가입</h2><p>서비스 이용에 필요한 기본 정보를 입력해 주세요.</p></div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldRow}>
          <div className={styles.field}><label htmlFor="web-signup-email">이메일</label><input id="web-signup-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setCheckedEmail(""); }} placeholder="email@example.com" autoComplete="email" /></div>
          <button type="button" className={styles.secondaryButton} onClick={handleEmailCheck}>중복확인</button>
        </div>
        {Boolean(checkedEmail) && checkedEmail === email && <p className={styles.message}>사용 가능한 이메일입니다.</p>}
        <div className={styles.field}>
          <label htmlFor="web-signup-password">비밀번호</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
            <input
              id="web-signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호 입력"
              autoComplete="new-password"
              style={{ paddingRight: "40px", width: "100%" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                color: "#888",
                zIndex: 2,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="web-signup-confirm-password">비밀번호 확인</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
            <input
              id="web-signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="비밀번호 확인 입력"
              autoComplete="new-password"
              style={{ paddingRight: "40px", width: "100%" }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                color: "#888",
                zIndex: 2,
              }}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.field}><label htmlFor="web-signup-name">이름</label><input id="web-signup-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="이름 입력" autoComplete="name" /></div>

        {/* 연락처 3분할 입력 필드 */}
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
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setPhone2(val);
                if (val.length === 4 && phone3Ref.current) {
                  phone3Ref.current.focus();
                }
              }}
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
              ref={phone3Ref}
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

        <div className={styles.field}>
          <label htmlFor="web-signup-birthdate">생년월일</label>
          <input
            id="web-signup-birthdate"
            type="date"
            value={birthDate}
            max={new Date().toISOString().substring(0, 10)}
            min="1900-01-01"
            onChange={(event) => setBirthDate(event.target.value)}
          />
        </div>

        <div className={styles.terms}>
          <div className={`${styles.termsRow} ${styles.termsAll}`}><label className={styles.termLabel}><input type="checkbox" checked={allAgreed} onChange={toggleAll} />전체 동의</label></div>
          <div className={styles.termsRow}><label className={styles.termLabel}><input type="checkbox" checked={serviceAgreed} onChange={(event) => setServiceAgreed(event.target.checked)} /><span><b className={styles.required}>[필수]</b> 서비스 이용약관</span></label><button type="button" className={styles.textButton} onClick={() => setOpenTerm("service")}>자세히</button></div>
          <div className={styles.termsRow}><label className={styles.termLabel}><input type="checkbox" checked={privacyAgreed} onChange={(event) => setPrivacyAgreed(event.target.checked)} /><span><b className={styles.required}>[필수]</b> 개인정보 처리방침</span></label><button type="button" className={styles.textButton} onClick={() => setOpenTerm("privacy")}>자세히</button></div>
          <div className={styles.termsRow}><label className={styles.termLabel}><input type="checkbox" checked={marketingAgreed} onChange={(event) => setMarketingAgreed(event.target.checked)} /><span><b className={styles.optional}>[선택]</b> 마케팅 정보 수신</span></label></div>
        </div>
        <button className={styles.submit} type="submit" disabled={!requiredAgreed || submitting}>{submitting ? "가입 중..." : "가입하기"}</button>
      </form>
      <p className={styles.switch}><span>이미 회원이신가요?</span><Link to="/web/login">로그인</Link></p>

      {openTerm && (
        <div className={styles.overlay} onMouseDown={() => setOpenTerm(null)}>
          <section className={styles.termsModal} role="dialog" aria-modal="true" aria-labelledby="web-term-title" onMouseDown={(event) => event.stopPropagation()}>
            <h3 id="web-term-title">{TERMS[openTerm].title}</h3>
            <div className={styles.termsBody}>{TERMS[openTerm].body}</div>
            <button type="button" className={styles.submit} onClick={() => setOpenTerm(null)}>확인</button>
          </section>
        </div>
      )}
    </WebAuthLayout>
  );
}
