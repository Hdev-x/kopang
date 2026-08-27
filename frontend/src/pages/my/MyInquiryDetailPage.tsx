import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { getQna } from "../../api/qna";
import type { QnaPost } from "../../types/qna";
import s from "../../styles/Qna.module.css";

export function MyInquiryDetailPage() {
  const [params] = useSearchParams();
  const { id } = useParams();
  const tab = params.get("tab") === "general" ? "general" : "product";
  const [item, setItem] = useState<QnaPost | null>(null);

  useEffect(() => {
    if (!id) return;

    getQna(Number(id)).then(setItem);
  }, [id]);

  if (!item) {
    return (
      <Layout>
        <PageHeader title="문의 상세" backTo={`/my/inquiries?tab=${tab}`} />
        <p className={s.empty}>문의를 찾을 수 없어요.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="문의 상세" backTo={`/my/inquiries?tab=${tab}`} />

      <Card className={s.qCard}>
        <div className={s.itemHead}>
          <span className={`${s.badge} ${item.status === "답변완료" ? s.done : s.wait}`}>
            {item.status}
          </span>
          <span className={s.date}>
            {item.createdAt} · {item.type === "PRODUCT" ? "상품문의" : "일반문의"}
          </span>
        </div>
        <p className={s.qTitle}>{item.title}</p>
        <p className={s.qContent}>{item.content}</p>

      </Card>

      {item.answerContent ? (
        <Card className={s.aCard}>
          <p className={s.aLabel}>답변 · 코팡 고객센터</p>
          <p className={s.aContent}>{item.answerContent}</p>
          <p className={s.date}>{item.createdAt}</p>
        </Card>
      ) : (
        <p className={s.waiting}>답변을 준비 중이에요.</p>
      )}
    </Layout>
  );
}
