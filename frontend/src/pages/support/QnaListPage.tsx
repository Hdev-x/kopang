import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { getQnaList } from "../api/qna";
import type { QnaSummary } from "../types/qna";
import s from "./Qna.module.css";

export function QnaListPage() {
  const [items, setItems] = useState<QnaSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getQnaList().then(setItems).catch(console.error);
  }, []);

  return (
    <Layout>
      <PageHeader title="1:1 문의" />
      <Button className={s.writeBtn} onClick={() => navigate("/qna/write")}>
        문의하기
      </Button>

      <div className={s.list}>
        {items.map((q) => (
          <Link key={q.id} to={`/qna/${q.id}`} className={s.cardLink}>
            <div className={s.item}>
              <div className={s.itemHead}>
                <span className={`${s.badge} ${q.status === "답변완료" ? s.done : s.wait}`}>
                  {q.status}
                </span>
                <span className={s.date}>{q.createdAt}</span>
              </div>
              <p className={s.itemTitle}>{q.title}</p>
              <p className={s.author}>{q.author}</p>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
