import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { getQnaList } from "../../api/qna";
import type { QnaSummary } from "../../types/qna";
import s from "../../styles/Qna.module.css";

export function MyInquiriesPage() {
  const navigate = useNavigate();
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

      <div style={{ padding: "0 var(--space-4)", marginTop: "var(--space-2)", marginBottom: "var(--space-2)" }}>
        <Button className={s.writeBtn} onClick={() => navigate("/support/inquiry")}>
          + 1:1 문의하기
        </Button>
      </div>

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
        {rows.length === 0 ? (
          <div className={s.empty}>
            <p style={{ marginBottom: "16px" }}>등록된 {tab === "product" ? "상품문의" : "일반문의"} 내역이 없어요.</p>
          </div>
        ) : (
          rows.map((it) => (
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
          ))
        )}
      </div>
    </Layout>
  );
}
