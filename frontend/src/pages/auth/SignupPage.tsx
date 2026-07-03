import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { login as authLogin } from "../lib/auth";
import styles from "./LoginPage.module.css";

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
  const [name, setName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMkt, setAgreeMkt] = useState(false);
  const [openTerm, setOpenTerm] = useState<null | "service" | "privacy">(null);
  const navigate = useNavigate();

  const allAgreed = agreeTerms && agreePrivacy && agreeMkt;
  const requiredOk = agreeTerms && agreePrivacy; // 필수 약관
  const toggleAll = () => {
    const v = !allAgreed;
    setAgreeTerms(v);
    setAgreePrivacy(v);
    setAgreeMkt(v);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!requiredOk) return;
    // 목업: 가입 즉시 로그인 상태로 처리하고 홈 이동
    authLogin({ name: name || "홍길동" });
    navigate("/");
  };

  return (
    <Layout>
      <PageHeader />
      <div className={styles.wrap}>
        <h1 className={styles.title}>회원가입</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="이메일"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="이름"
            placeholder="이름 입력"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
