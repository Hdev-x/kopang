import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { createQna } from "../api/qna";
import s from "./Qna.module.css";

export function QnaWritePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createQna(title, content);
    } catch (err) {
      console.error("문의 등록 실패:", err);
    }
    navigate("/qna");
  };

  return (
    <Layout>
      <PageHeader title="문의하기" />
      <form className={s.form} onSubmit={handleSubmit}>
        <input
          className={s.input}
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={s.textarea}
          placeholder="문의 내용을 입력해주세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button type="submit" className={s.submit} disabled={!title || !content}>
          등록
        </Button>
      </form>
    </Layout>
  );
}
