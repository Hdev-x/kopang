import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { getQnaList } from "../../api/qna";
import type { QnaSummary } from "../../types/qna";
import s from "../../styles/Qna.module.css";

export function MyInquiriesPage() {
  const [params, setParams] = useSearchParams();
  const tab: "product" | "general" =
    params.get("tab") === "general" ? "general" : "product";

  const [productRows, setProductRows] = useState<QnaSummary[]>([]);
  const [generalRows, setGeneralRows] = useState<QnaSummary[]>([]);

  const rows = tab === "product" ? productRows : generalRows;
  const productCount = productRows.length;
  const generalCount = generalRows.length;

  useEffect(() => {
    getQnaList("PRODUCT").then(setProductRows);
    getQnaList("GENERAL").then(setGeneralRows);
  }, []);

  return (
    <Layout>
      <PageHeader title="문의내역" backTo="/my" />

      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === "product" ? s.tabActive : ""}`}
          onClick={() => setParams({ tab: "product" })}
        >
          상품문의 {productCount}
        </button>
        <button
          className={`${s.tab} ${tab === "general" ? s.tabActive : ""}`}
          onClick={() => setParams({ tab: "general" })}
        >
          일반문의 {generalCount}
        </button>
      </div>

      <div className={s.list}>
        {rows.map((it) => (
          <Link key={it.id} to={`/my/inquiries/${it.id}?tab=${tab}`} className={s.cardLink}>
            <div className={s.item}>
              <div className={s.itemHead}>
                <span className={`${s.badge} ${it.status === "답변완료" ? s.done : s.wait}`}>
                  {it.status}
                </span>
                <span className={s.date}>{it.createdAt}</span>
              </div>
              <p className={s.itemTitle}>{it.title}</p>

            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
