import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { getNoticeList } from "../../api/notice";
import type { Notice } from "../../types/notice";
import s from "../../styles/Qna.module.css";


export function NoticeListPage() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    getNoticeList()
      .then(setNotices)
      .catch(console.error);
  }, []);

  return (
    <Layout>
      <PageHeader title="공지사항" />

      <div className={s.list}>
        {notices.map((notice) => (
          <Link
            key={notice.id}
            to={`/my/support/notices/${notice.id}`}
            className={s.cardLink}
          >
            <div className={s.item}>
              <div className={s.itemHead}>
                <span className={s.date}>
                  {notice.createdAt.slice(0, 10)}
                </span>
              </div>

              <p className={s.itemTitle}>{notice.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
