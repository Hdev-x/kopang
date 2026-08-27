import { useEffect, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Skeleton, SkeletonRows } from "../../../components/Skeleton";
import { getPurchaseStats, type PurchaseStats } from "../../../api/adminPurchaseStats";
import styles from "./AdminStatsPage.module.css";

export function AdminStatsPage() {
  const [data, setData] = useState<PurchaseStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPurchaseStats().then(setData).catch(() => setError(true));
  }, []);

  const kpis = [
    { label: "이번달 매출", value: data ? `${data.monthSales.toLocaleString()}원` : null },
    { label: "주문 수", value: data ? data.orderCount.toLocaleString() : null },
    { label: "객단가", value: data ? `${data.averageOrderValue.toLocaleString()}원` : null },
    { label: "재구매율", value: data ? `${data.repeatPurchaseRate.toFixed(1)}%` : null },
  ];
  const monthly = data?.monthlySales ?? [];
  const maxSales = Math.max(...monthly.map((item) => item.amount), 1);
  const top = data?.topProducts ?? [];

  return (
    <AdminLayout title="매출 · 구매 분석" fullBleed>
      <div className={styles.page}>
        <p className={styles.caption}>이번 달 매출과 인기 상품 성과</p>

        <div className={styles.kpis}>
          {kpis.map((k) => (
            <div key={k.label} className={styles.kCell}>
              <div className={styles.kLabel}>{k.label}</div>
              <div className={styles.kValue}>{k.value ?? <Skeleton w={92} h={22} />}</div>
            </div>
          ))}
        </div>

        <div className={styles.sec}>
          <h2 className={styles.secHead}>월별 매출</h2>
          {error ? (
            <p className={styles.muted}>구매 분석을 불러오지 못했습니다.</p>
          ) : monthly.length === 0 ? (
            /* 축·높이를 유지한 빈 막대 — 값이 오면 그 자리에서 자란다 */
            <div className={styles.chart}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={styles.bar}>
                  <div className={styles.barTrack} />
                  <span className={styles.barLabel}><Skeleton w={22} h={10} /></span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.chart}>
              {monthly.map((sale) => (
                <div key={sale.month} className={styles.bar}>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ height: `${(sale.amount / maxSales) * 100}%` }} title={`${sale.amount.toLocaleString()}원`} />
                  </div>
                  <span className={styles.barLabel}>{sale.month.slice(5)}월</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles.sec} ${styles.secGrow}`}>
          <h2 className={styles.secHead}>인기 상품 · 재구매율</h2>
          {top.length === 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.tbl}>
                <thead>
                  <tr><th>상품</th><th className={styles.r}>판매량</th><th className={styles.r}>재구매율</th></tr>
                </thead>
                <tbody><SkeletonRows rows={8} cols={3} widths={["74%", "46%", "44%"]} /></tbody>
              </table>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.tbl}>
                <thead>
                  <tr><th>상품</th><th className={styles.r}>판매량</th><th className={styles.r}>재구매율</th></tr>
                </thead>
                <tbody>
                  {top.map((p, i) => (
                    <tr key={p.productId}>
                      <td className={styles.name}><span className={styles.rank}>{i + 1}</span>{p.name}</td>
                      <td className={styles.r}>{p.quantity.toLocaleString()}</td>
                      <td className={styles.r}>{p.repeatPurchaseRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
