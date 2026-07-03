import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { NOTICES } from "../mocks/supportData";
import s from "./Qna.module.css";

export function NoticeListPage() {
  return (
    <Layout>
      <PageHeader title="공지사항" />
      <div className={s.list}>
        {NOTICES.map((n) => (
          <Link key={n.id} to={`/my/support/notices/${n.id}`} className={s.cardLink}>
            <div className={s.item}>
              <div className={s.itemHead}>
                <span className={s.date}>{n.date}</span>
              </div>
              <p className={s.itemTitle}>{n.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
