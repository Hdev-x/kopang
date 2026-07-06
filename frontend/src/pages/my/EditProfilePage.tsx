import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // 회원 정보 로드 (마운트 시 자동 실행)
  useEffect(() => {
    getProfile()
      .then((data) => {
        setName(data.name || "");
        setPhone(data.phone || "");
        setBirthDate(data.birthDate || "");
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
    try {
      await updateProfile({
        name,
        phone,
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
    } catch {
      alert("회원 정보 수정에 실패했습니다. 입력값을 확인해 주세요.");
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
        <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="연락처" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="생년월일" placeholder="YYYY-MM-DD" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        <Input label="새 비밀번호" type="password" placeholder="변경 시 입력" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

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