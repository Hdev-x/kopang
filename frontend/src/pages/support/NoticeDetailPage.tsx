import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { getNotice } from "../../api/notice";
import type { Notice } from "../../types/notice";
import s from "../../styles/Qna.module.css";

export function NoticeDetailPage() {
  const { id } = useParams();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    getNotice(Number(id))
      .then(setNotice)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <PageHeader title="공지사항" backTo="/my/support/notices" />
        <p className={s.empty}>불러오는 중...</p>
      </Layout>
    );
  }

  if (!notice) {
    return (
      <Layout>
        <PageHeader title="공지사항" backTo="/my/support/notices" />
        <p className={s.empty}>공지를 찾을 수 없어요.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="공지사항" backTo="/my/support/notices" />

      <Card className={s.qCard}>
        <p className={s.date}>{notice.createdAt.slice(0, 10)}</p>
        <p className={s.qTitle}>{notice.title}</p>
        <p className={s.qContent}>{notice.content}</p>
      </Card>
    </Layout>
  );
}