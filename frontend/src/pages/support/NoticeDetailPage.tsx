import { useParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { NOTICES } from "../../mocks/supportData";
import s from "../../styles/Qna.module.css";

export function NoticeDetailPage() {
  const { id } = useParams();
  const notice = NOTICES.find((n) => n.id === id);

  if (!notice) {
    return (
      <Layout>
        <PageHeader title="공지사항" />
        <p className={s.empty}>공지를 찾을 수 없어요.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="공지사항" />
      <Card className={s.qCard}>
        <p className={s.date}>{notice.date}</p>
        <p className={s.qTitle}>{notice.title}</p>
        <p className={s.qContent}>{notice.content}</p>
      </Card>
    </Layout>
  );
}
