import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { signup as apiSignup, checkEmail as apiCheckEmail } from "../../api/auth";
import styles from "../../styles/LoginPage.module.css";

// 약관 원문 (목업 예시 문안)
const TERMS = {
  service: {
    title: "서비스 이용약관",
    body: `제1조 (목적)
본 약관은 코팡(KOPANG)이 제공하는 전자상거래 서비스의 이용 조건 및 절차, 회원과 회사의 권리·의무·책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
"회원"이란 본 약관에 동의하고 회사와 이용계약을 체결한 자를 말합니다.

제3조 (약관의 효력 및 변경)
본 약관은 서비스 화면에 게시함으로써 효력이 발생하며, 회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.

제4조 (서비스의 제공)
회사는 상품 정보 제공, 주문·결제, 배송 등의 서비스를 제공하며, 운영상·기술상 필요 시 일부를 변경할 수 있습니다.

※ 본 약관은 목업용 예시 문안입니다.`,
  },
  privacy: {
    title: "개인정보 처리방침",
    body: `1. 수집하는 개인정보 항목
회사는 회원가입, 주문, 고객상담을 위해 이메일, 비밀번호, 이름, 연락처, 배송지 정보를 수집합니다.

2. 개인정보의 이용 목적
회원 식별 및 관리, 주문·배송, 이벤트·혜택 안내, 서비스 개선에 이용합니다.

3. 개인정보의 보유 및 이용 기간
회원 탈퇴 시 지체 없이 파기하며, 관계 법령에 따라 일정 기간 보관할 수 있습니다.

4. 개인정보의 제3자 제공
회사는 회원의 동의 없이 개인정보를 외부에 제공하지 않습니다.

※ 본 방침은 목업용 예시 문안입니다.`,
  },
};

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone1, setPhone1] = useState("010");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMkt, setAgreeMkt] = useState(false);
  const [openTerm, setOpenTerm] = useState<null | "service" | "privacy">(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [checkedEmailStr, setCheckedEmailStr] = useState("");
  const navigate = useNavigate();

  const allAgreed = agreeTerms && agreePrivacy && agreeMkt;
  const requiredOk = agreeTerms && agreePrivacy; // 필수 약관
  const toggleAll = () => {
    const v = !allAgreed;
    setAgreeTerms(v);
    setAgreePrivacy(v);
    setAgreeMkt(v);
  };

  const handleCheckDuplicate = async () => {
    if (!email) {
      alert("이메일을 입력해 주세요.");
      return;
    }
    if (!email.includes("@")) {
      alert("올바른 이메일 형식(@ 포함)을 입력해 주세요.");
      return;
    }
    try {
      const checkRes = await apiCheckEmail(email);
      if (checkRes.exists) {
        alert("이미 사용 중인 이메일입니다.");
        setEmailChecked(false);
      } else {
        alert("사용 가능한 이메일입니다.");
        setEmailChecked(true);
        setCheckedEmailStr(email);
      }
    } catch (err) {
      alert("이메일 중복 확인에 실패했습니다.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!requiredOk) {
      alert("필수 약관에 동의해 주세요.");
      return;
    }
    if (!emailChecked || email !== checkedEmailStr) {
      alert("이메일 중복 확인을 진행해 주세요.");
      return;
    }
    if (password.length < 8) {
      alert("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!name.trim()) {
      alert("이름을 입력해 주세요.");
      return;
    }

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
      // 회원 등록 (FR-USER-01)
      await apiSignup({
        email,
        password,
        name,
        phone: phoneFull
      });
      alert("회원가입이 성공적으로 완료되었습니다! 로그인해 주세요.");
      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data?.message || "회원가입에 실패했습니다. 입력값을 확인해 주세요.";
      alert(msg);
    }
  };

  return (
    <Layout>
      <PageHeader />
      <div className={styles.wrap}>
        <h1 className={styles.title}>회원가입</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Input
                label="이메일"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value !== checkedEmailStr) {
                    setEmailChecked(false);
                  }
                }}
              />
            </div>
            <Button
              type="button"
              onClick={handleCheckDuplicate}
              style={{ height: "45px", minWidth: "80px", marginBottom: "15px" }}
            >
              중복확인
            </Button>
          </div>
          {emailChecked && (
            <p style={{ color: "green", fontSize: "12px", marginTop: "-10px", marginBottom: "10px" }}>
              ✓ 사용 가능한 이메일입니다.
            </p>
          )}

          <div style={{ position: "relative", width: "100%", marginBottom: "15px" }}>
            <Input
              label="비밀번호"
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                bottom: "12px",
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
          <div style={{ position: "relative", width: "100%", marginBottom: "15px" }}>
            <Input
              label="비밀번호 확인"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="비밀번호 확인 입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "12px",
                bottom: "12px",
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
          <Input
            label="이름"
            placeholder="이름 입력"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* 연락처 3분할 입력 필드 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginBottom: "15px" }}>
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

          {/* 약관 동의 (필수/선택) */}
          <div className={styles.terms}>
            <label className={styles.termAll}>
              <input type="checkbox" checked={allAgreed} onChange={toggleAll} />
              <span>전체 동의</span>
            </label>
            <div className={styles.termRow}>
              <label className={styles.term}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>
                  <b className={styles.req}>[필수]</b> 서비스 이용약관 동의
                </span>
              </label>
              <button type="button" className={styles.detail} onClick={() => setOpenTerm("service")}>
                자세히
              </button>
            </div>
            <div className={styles.termRow}>
              <label className={styles.term}>
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                />
                <span>
                  <b className={styles.req}>[필수]</b> 개인정보 처리방침 동의
                </span>
              </label>
              <button type="button" className={styles.detail} onClick={() => setOpenTerm("privacy")}>
                자세히
              </button>
            </div>
            <label className={styles.term}>
              <input
                type="checkbox"
                checked={agreeMkt}
                onChange={(e) => setAgreeMkt(e.target.checked)}
              />
              <span>
                <span className={styles.opt}>[선택]</span> 마케팅 정보 수신 동의
              </span>
            </label>
          </div>

          <Button type="submit" className={styles.submit} disabled={!requiredOk}>
            가입하기
          </Button>
        </form>
        <p className={styles.switch}>
          이미 회원이신가요? <Link to="/login">로그인</Link>
        </p>
      </div>

      {/* 약관 원문 모달 */}
      {openTerm && (
        <div className={styles.overlay} onClick={() => setOpenTerm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{TERMS[openTerm].title}</h3>
            <div className={styles.modalBody}>{TERMS[openTerm].body}</div>
            <Button className={styles.modalClose} onClick={() => setOpenTerm(null)}>
              확인
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
