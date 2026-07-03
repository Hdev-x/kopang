import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { getQna } from "../../api/qna";
import type { QnaPost } from "../../types/qna";
import s from "../../styles/Qna.module.css";

export function QnaDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<QnaPost | null>(null);

  useEffect(() => {
    if (id) getQna(Number(id)).then(setPost).catch(console.error);
  }, [id]);

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

      {post.answer ? (
        <Card className={s.aCard}>
          <p className={s.aLabel}>답변 · 코팡 고객센터</p>
          <p className={s.aContent}>{post.answer.content}</p>
          <p className={s.date}>{post.answer.createdAt}</p>
        </Card>
      ) : (
        <p className={s.waiting}>답변을 준비 중이에요.</p>
      )}
    </Layout>
  );
}
