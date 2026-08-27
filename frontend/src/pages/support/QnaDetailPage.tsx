import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { answerQna, getQna } from "../../api/qna";
import type { QnaPost } from "../../types/qna";
import s from "../../styles/Qna.module.css";

export function QnaDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<QnaPost | null>(null);
  const [answerContent, setAnswerContent] = useState("");


  useEffect(() => {
    if (id) getQna(Number(id)).then(setPost).catch(console.error);
  }, [id]);

  async function handleAnswerSubmit() {
    const trimmedAnswer = answerContent.trim();

    if (!id || !trimmedAnswer) {
      return;
    }
    await answerQna(Number(id), trimmedAnswer);

    const updatePost = await getQna(Number(id));
    setPost(updatePost);
    setAnswerContent("");

  }
  if (!post) {
    return (
      <Layout>
        <PageHeader title="문의 상세" />
        <p className={s.empty}>불러오는 중...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="문의 상세" />

      <Card className={s.qCard}>
        <div className={s.itemHead}>
          <span className={`${s.badge} ${post.status === "답변완료" ? s.done : s.wait}`}>
            {post.status}
          </span>
          <span className={s.date}>{post.createdAt}</span>
        </div>
        <p className={s.qTitle}>{post.title}</p>
        <p className={s.qContent}>{post.content}</p>
      </Card>

      {post.answerContent ? (
        <Card className={s.aCard}>
          <p className={s.aLabel}>답변 · 코팡 고객센터</p>
          <p className={s.aContent}>{post.answerContent}</p>
        </Card>
      ) : (
        <div className={s.answerForm}>
          <p className={s.waiting}>답변을 준비 중이에요.</p>
          <textarea
            className={s.answerTextarea}
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            placeholder="답변 내용을 입력하세요"
          />
          <button
            className={s.answerButton}
            type="button"
            onClick={handleAnswerSubmit}
          >
            답변등록
          </button>
        </div>
      )}
    </Layout>
  );
}