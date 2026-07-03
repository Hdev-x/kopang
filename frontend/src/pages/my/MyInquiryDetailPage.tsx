import { useParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { INQUIRIES } from "../../mocks/inquiryData";
import s from "../../styles/Qna.module.css";

export function MyInquiryDetailPage() {
  const { id } = useParams();
  const item = INQUIRIES.find((i) => i.id === id);

  if (!item) {
    return (
      <Layout>
        <PageHeader title="문의 상세" />
        <p className={s.empty}>문의를 찾을 수 없어요.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="문의 상세" />

      <Card className={s.qCard}>
        <div className={s.itemHead}>
          <span className={`${s.badge} ${item.status === "답변완료" ? s.done : s.wait}`}>
            {item.status}
          </span>
          <span className={s.date}>
            {item.date} · {item.type === "product" ? "상품문의" : "일반문의"}
          </span>
        </div>
        <p className={s.qTitle}>{item.title}</p>
        {item.product && (
          <p className={s.author} style={{ marginBottom: "var(--space-2)" }}>
            {item.product}
          </p>
        )}
        <p className={s.qContent}>{item.question}</p>
      </Card>

      {item.answer ? (
        <Card className={s.aCard}>
          <p className={s.aLabel}>답변 · 코팡 고객센터</p>
          <p className={s.aContent}>{item.answer}</p>
          <p className={s.date}>{item.date}</p>
        </Card>
      ) : (
        <p className={s.waiting}>답변을 준비 중이에요.</p>
      )}
    </Layout>
  );
}
