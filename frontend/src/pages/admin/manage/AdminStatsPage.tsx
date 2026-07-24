import { useEffect, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import { getPurchaseStats, type PurchaseStats } from "../../../api/adminPurchaseStats";
import sh from "../adminShared.module.css";
import styles from "./AdminStatsPage.module.css";

export function AdminStatsPage() {
  const [data, setData] = useState<PurchaseStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPurchaseStats().then(setData).catch(() => setError(true));
  }, []);

  const kpis = [
    { label: "이번달 매출", value: data ? `${data.monthSales.toLocaleString()}원` : "—" },
    { label: "주문 수", value: data ? data.orderCount.toLocaleString() : "—" },
    { label: "객단가", value: data ? `${data.averageOrderValue.toLocaleString()}원` : "—" },
    { label: "재구매율", value: data ? `${data.repeatPurchaseRate.toFixed(1)}%` : "—" },
  ];
  const maxSales = Math.max(...(data?.monthlySales ?? []).map((item) => item.amount), 1);

  return (
    <AdminLayout title="매출 · 구매 분석">
      <div className={sh.stats}>
        {kpis.map((k) => (
          <div key={k.label} className={sh.statCard}>
            <p className={sh.statLabel}>{k.label}</p>
            <p className={sh.statValue}>{k.value}</p>
          </div>
        ))}
      </div>

      <h2 className={sh.sectionTitle}>월별 매출</h2>
      <div className={sh.card}>
        {error && <p className={sh.muted}>구매 분석을 불러오지 못했습니다.</p>}
        <div className={styles.chart}>
          {(data?.monthlySales ?? []).map((sale) => (
            <div key={sale.month} className={styles.bar}>
              <div
                className={styles.barFill}
                style={{ height: `${(sale.amount / maxSales) * 100}%` }}
                title={`${sale.amount.toLocaleString()}원`}
              />
              <span className={styles.barLabel}>{sale.month.slice(5)}월</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className={sh.sectionTitle}>인기 상품 · 재구매율</h2>
      <div className={sh.list}>
        {(data?.topProducts ?? []).map((product) => (
          <Card key={product.productId}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>{product.name}</span>
              <span className={`${sh.badge} ${sh.bInfo}`}>
                재구매 {product.repeatPurchaseRate.toFixed(1)}%
              </span>
            </div>
            <p className={sh.itemMeta}>판매량 {product.quantity.toLocaleString()}</p>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
