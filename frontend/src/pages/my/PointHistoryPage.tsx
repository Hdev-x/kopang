import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import s from "../../styles/AccountPages.module.css";

const POINTS = [
  { date: "2026.06.28", desc: "구매 적립", amt: 697 },
  { date: "2026.06.25", desc: "리뷰 작성 적립", amt: 500 },
  { date: "2026.06.20", desc: "결제 사용", amt: -1000 },
  { date: "2026.06.15", desc: "출석 체크", amt: 10 },
];

export function PointHistoryPage() {
  return (
    <Layout>
      <PageHeader title="포인트 내역" />
      <div className={s.summary}>
        <div className={s.summaryNum}>1,200P</div>
        <div className={s.summaryLabel}>사용 가능 포인트</div>
      </div>
      <div className={s.list}>
        {POINTS.map((p, i) => (
          <Card key={i}>
            <div className={s.row}>
              <div className={s.col}>
                <span>{p.desc}</span>
                <span className={s.muted}>{p.date}</span>
              </div>
              <span className={p.amt >= 0 ? s.plus : s.minus}>
                {p.amt >= 0 ? "+" : ""}
                {p.amt.toLocaleString()}P
              </span>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
