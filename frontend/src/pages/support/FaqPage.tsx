import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { FAQS } from "../../mocks/supportData";
import s from "../../styles/AccountPages.module.css";

export function FaqPage() {
  return (
    <Layout>
      <PageHeader title="자주 묻는 질문" />
      <div className={s.list}>
        {FAQS.map((f, i) => (
          <Card key={i}>
            <p className={s.faqQ}>Q. {f.q}</p>
            <p className={s.faqA}>{f.a}</p>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
