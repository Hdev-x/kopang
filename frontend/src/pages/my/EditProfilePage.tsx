import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import s from "../../styles/AccountPages.module.css";

export function EditProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("홍길동");
  const [phone, setPhone] = useState("010-1234-5678");
  const [address, setAddress] = useState("서울 강남구 테헤란로 123, 4층");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // 목업: 저장 없이 마이페이지로 복귀
    navigate("/my");
  };

  return (
    <Layout>
      <PageHeader title="회원정보 수정" />
      <form className={s.form} onSubmit={handleSubmit}>
        <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="연락처" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="배송지" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label="새 비밀번호" type="password" placeholder="변경 시 입력" />
        <Button type="submit" className={s.submit}>
          저장하기
        </Button>
      </form>
    </Layout>
  );
}
