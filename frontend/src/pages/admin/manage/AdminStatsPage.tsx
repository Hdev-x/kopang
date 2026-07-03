import { AdminLayout } from "../components/AdminLayout";
import { Card } from "../components/Card";
import sh from "./adminShared.module.css";
import styles from "./AdminStatsPage.module.css";

const KPIS = [
  { label: "이번달 매출", value: "₩48.2M" },
  { label: "주문 수", value: "3,841" },
  { label: "객단가", value: "₩12,550" },
  { label: "재구매율", value: "37%" },
];
const SALES = [
  { m: "2월", v: 62 }, { m: "3월", v: 70 }, { m: "4월", v: 58 },
  { m: "5월", v: 84 }, { m: "6월", v: 100 },
];
const TOP = [
  { name: "제주 삼다수 2L x6", qty: 1280, rebuy: "52%" },
  { name: "유기농 오이 3입", qty: 940, rebuy: "44%" },
  { name: "주방세제 리필", qty: 760, rebuy: "61%" },
  { name: "USB-C 충전기 30W", qty: 410, rebuy: "12%" },
];

export function AdminStatsPage() {
  return (
    <AdminLayout title="매출 · 구매 분석">
      <div className={sh.stats}>
        {KPIS.map((k) => (
          <div key={k.label} className={sh.statCard}>
            <p className={sh.statLabel}>{k.label}</p>
            <p className={sh.statValue}>{k.value}</p>
          </div>
        ))}
      </div>

      <h2 className={sh.sectionTitle}>월별 매출</h2>
      <div className={sh.card}>
        <div className={styles.chart}>
          {SALES.map((s) => (
            <div key={s.m} className={styles.bar}>
              <div className={styles.barFill} style={{ height: `${s.v}%` }} />
              <span className={styles.barLabel}>{s.m}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className={sh.sectionTitle}>인기 상품 · 재구매율</h2>
      <div className={sh.list}>
        {TOP.map((t) => (
          <Card key={t.name}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>{t.name}</span>
              <span className={`${sh.badge} ${sh.bInfo}`}>재구매 {t.rebuy}</span>
            </div>
            <p className={sh.itemMeta}>판매량 {t.qty.toLocaleString()}</p>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
