import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { getFaqList } from "../../api/faq";
import type { Faq } from "../../types/faq";
import s from "../../styles/AccountPages.module.css";

export function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    getFaqList()
      .then(setFaqs)
      .catch(() => setError(true));
  }, []);

  return (
    <Layout>
      <PageHeader title="자주 묻는 질문" />
      <div className={s.list}>
        {error && <p className={s.muted}>FAQ를 불러오지 못했습니다.</p>}
        {!error && faqs.length === 0 && (
          <p className={s.muted}>등록된 FAQ가 없습니다.</p>
        )}
        {faqs.map((faq) => (
          <Card key={faq.id}>
            <p className={s.faqQ}>Q. {faq.question}</p>
            <p className={s.faqA}>{faq.answer}</p>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
