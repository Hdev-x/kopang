import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { INQUIRIES } from "../../mocks/inquiryData";
import s from "../../styles/Qna.module.css";

export function MyInquiriesPage() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<"product" | "general">(
    params.get("tab") === "general" ? "general" : "product"
  );

  const productCount = INQUIRIES.filter((i) => i.type === "product").length;
  const generalCount = INQUIRIES.filter((i) => i.type === "general").length;
  const rows = INQUIRIES.filter((i) => i.type === tab);

  return (
    <Layout>
      <PageHeader title="문의내역" />

      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === "product" ? s.tabActive : ""}`}
          onClick={() => setTab("product")}
        >
          상품문의 {productCount}
        </button>
        <button
          className={`${s.tab} ${tab === "general" ? s.tabActive : ""}`}
          onClick={() => setTab("general")}
        >
          일반문의 {generalCount}
        </button>
      </div>

      <div className={s.list}>
        {rows.map((it) => (
          <Link key={it.id} to={`/my/inquiries/${it.id}`} className={s.cardLink}>
            <div className={s.item}>
              <div className={s.itemHead}>
                <span className={`${s.badge} ${it.status === "답변완료" ? s.done : s.wait}`}>
                  {it.status}
                </span>
                <span className={s.date}>{it.date}</span>
              </div>
              <p className={s.itemTitle}>{it.title}</p>
              {it.product && <p className={s.author}>{it.product}</p>}
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
