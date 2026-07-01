import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { NOTICES, FAQS } from "../mocks/supportData";
import s from "./AccountPages.module.css";

export function SupportPage() {
  const navigate = useNavigate();
  return (
    <Layout>
      <PageHeader title="고객센터" />
      <p className={s.muted} style={{ marginBottom: "var(--space-4)" }}>
        공지사항·FAQ를 확인하거나, 1:1 문의 또는 우하단 AI 상담봇을 이용하세요.
      </p>

      <Button
        style={{ width: "100%", marginBottom: "var(--space-2)" }}
        onClick={() => navigate("/my/support/inquiry")}
      >
        1:1 문의하기
      </Button>
      <p className={s.muted} style={{ fontSize: "var(--font-xs)" }}>
        문의 내역은 마이페이지 &gt; 문의내역에서 확인할 수 있어요.
      </p>

      <div className={s.sectionHead}>
        <h2 className={s.section}>공지사항</h2>
        <Link to="/my/support/notices" className={s.more}>
          더보기
        </Link>
      </div>
      <div className={s.list}>
        {NOTICES.slice(0, 3).map((n) => (
          <Link key={n.id} to={`/my/support/notices/${n.id}`} className={s.cardLink}>
            <Card>
              <div className={s.row}>
                <span className={s.strong}>{n.title}</span>
                <span className={s.muted}>{n.date}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className={s.sectionHead}>
        <h2 className={s.section}>자주 묻는 질문</h2>
        <Link to="/my/support/faq" className={s.more}>
          더보기
        </Link>
      </div>
      <div className={s.list}>
        {FAQS.slice(0, 3).map((f, i) => (
          <Card key={i}>
            <p className={s.faqQ}>Q. {f.q}</p>
            <p className={s.faqA}>{f.a}</p>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
