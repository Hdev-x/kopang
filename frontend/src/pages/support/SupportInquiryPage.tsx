import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { createQna } from "../../api/qna";
import s from "../../styles/AccountPages.module.css";

export function SupportInquiryPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await createQna(title, content, "GENERAL");
      navigate("/my/inquiries?tab=general");
    } catch (error) {
      console.error("1:1 문의 등록 실패:", error);
    }
  };
  return (
    <Layout>
      <PageHeader title="1:1 문의하기" />
      <form className={s.form} onSubmit={submit}>
        <Input
          label="제목"
          placeholder="문의 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className={s.col}>
          <label className={s.muted}>내용</label>
          <textarea
            placeholder="문의 내용을 입력해주세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3)",
              minHeight: "140px",
              fontFamily: "inherit",
              fontSize: "var(--font-md)",
              resize: "vertical",
            }}
          />
        </div>
        <Button type="submit" className={s.submit}>
          등록
        </Button>
      </form>
    </Layout>
  );
}
