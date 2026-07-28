import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { getProfile, updateProfile, withdraw } from "../../api/auth";
import { logout } from "../../lib/auth";
import s from "../../styles/AccountPages.module.css";

export function EditProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone1, setPhone1] = useState("010");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // 회원 정보 로드 (마운트 시 자동 실행)
  useEffect(() => {
    getProfile()
      .then((data) => {
        setName(data.name || "");
        const phoneStr = data.phone || "";
        const parts = phoneStr.split("-");
        setPhone1(parts[0] || "010");
        setPhone2(parts[1] || "");
        setPhone3(parts[2] || "");

        // 생년월일 날짜 부분만 추출 (YYYY-MM-DD)
        const dateOnly = (data.birthDate || "").substring(0, 10);
        setBirthDate(dateOnly);
        setLoading(false);
      })
      .catch(() => {
        alert("회원 정보를 불러오지 못했습니다. 다시 로그인해 주세요.");
        logout();
        navigate("/login");
      });
  }, [navigate]);

  // 회원 정보 수정 처리
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setNameError("");
    setPhoneError("");
    setBirthDateError("");
    setPasswordError("");

    let hasError = false;

    // 1. 이름 검증
    if (!name.trim()) {
      setNameError("이름은 비워둘 수 없습니다.");
      hasError = true;
    } else if (name.length > 50) {
      setNameError("이름은 50자 이하로 입력해 주세요.");
      hasError = true;
    }

    // 2. 연락처 검증
    const phoneFull = `${phone1}-${phone2}-${phone3}`;
    const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
    if (!phone2 || !phone3) {
      setPhoneError("연락처를 끝까지 입력해 주세요.");
      hasError = true;
    } else if (!phoneRegex.test(phoneFull)) {
      setPhoneError("올바른 휴대폰 번호 형식이 아닙니다.");
      hasError = true;
    }

    // 3. 생년월일 검증
    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      const minDate = new Date("1900-01-01");
      if (birth > today) {
        setBirthDateError("생년월일은 미래 날짜일 수 없습니다.");
        hasError = true;
      } else if (birth < minDate) {
        setBirthDateError("올바른 날짜를 입력해 주세요. (1900년 이후)");
        hasError = true;
      }
    }

    // 4. 비밀번호 검증
    setPasswordError("");
    setConfirmPasswordError("");
    if (newPassword) {
      if (newPassword.length < 8) {
        setPasswordError("비밀번호는 최소 8자 이상이어야 합니다.");
        hasError = true;
      }
      if (newPassword !== confirmPassword) {
        setConfirmPasswordError("비밀번호가 일치하지 않습니다.");
        hasError = true;
      }
    }

    if (hasError) {
      return;
    }

    try {
      await updateProfile({
        name,
        phone: phoneFull,
        birthDate: birthDate || undefined,
        password: newPassword || undefined
      });

      // 1. 로컬스토리지의 기존 이름 정보 변경
      const rawAuth = localStorage.getItem("kopang_auth");
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth);
        parsed.name = name; // 입력받은 새 이름 대입
        localStorage.setItem("kopang_auth", JSON.stringify(parsed));

        // 2. 헤더/내비바 컴포넌트 실시간 갱신용 이벤트 트리거
        window.dispatchEvent(new Event("auth-change"));
      }
      alert("회원 정보가 성공적으로 수정되었습니다.");
      navigate("/my");
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || "회원 정보 수정에 실패했습니다. 입력값을 확인해 주세요.";
      alert(serverMessage);
    }
  };

  // 회원 탈퇴 처리
  const handleWithdraw = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까? 탈퇴 후 계정 복구는 불가능합니다.")) {
      return;
    }
    try {
      await withdraw();
      alert("탈퇴 처리가 완료되었습니다. 이용해 주셔서 감사합니다.");
      logout();
      navigate("/");
    } catch {
      alert("탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader title="회원정보 수정" />
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>로딩 중...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="회원정보 수정" />
      <form className={s.form} onSubmit={handleSubmit}>
        <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} error={nameError} />

        {/* 연락처 3분할 입력 필드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
          <span style={{ fontSize: "var(--font-sm, 14px)", fontWeight: 500, color: "var(--color-text)" }}>연락처</span>
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
                outline: "none"
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
                outline: "none"
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
                outline: "none"
              }}
            />
          </div>
          {phoneError && (
            <span style={{ color: "var(--color-danger, #ef4444)", fontSize: "var(--font-xs, 12px)", marginTop: "4px" }}>
              {phoneError}
            </span>
          )}
        </div>

        <Input label="생년월일" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} error={birthDateError} />
        
        <div style={{ position: "relative", width: "100%" }}>
          <Input
            label="새 비밀번호"
            type={showNewPassword ? "text" : "password"}
            placeholder="변경 시 입력 (최소 8자)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={passwordError}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            style={{
              position: "absolute",
              right: "12px",
              bottom: passwordError ? "32px" : "12px",
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
            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div style={{ position: "relative", width: "100%" }}>
          <Input
            label="새 비밀번호 확인"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="새 비밀번호 재입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPasswordError}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              position: "absolute",
              right: "12px",
              bottom: confirmPasswordError ? "32px" : "12px",
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

        <Button type="submit" className={s.submit}>
          저장하기
        </Button>
      </form>
      <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
        <button
          type="button"
          onClick={handleWithdraw}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-muted, #888)",
            fontSize: "var(--font-xs, 12px)",
            textDecoration: "underline",
            cursor: "pointer"
          }}
        >
          회원 탈퇴
        </button>
      </div>
    </Layout>
  );
}