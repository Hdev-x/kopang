import { useEffect, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import {
  getRecommendationPerformance,
  type RecommendationPerformance,
  type RecommendationResultItem,
} from "../../../api/adminRecommendations";
import styles from "./AdminRecommendationsPage.module.css";

function outcome(result: RecommendationResultItem) {
  if (result.converted) return { label: "전환", cls: styles.bOk };
  if (result.clicked) return { label: "클릭", cls: styles.bInfo };
  if (result.shown) return { label: "노출", cls: styles.bMuted };
  return { label: "생성", cls: styles.bWarn };
}

function formatRate(value: number | null) {
  return value == null ? "0.0%" : `${value.toFixed(1)}%`;
}

function kpis(data: RecommendationPerformance | null) {
  if (!data) {
    return [
      { label: "추천 노출(7일)", value: "—" },
      { label: "추천 클릭률", value: "—" },
      { label: "추천 전환율", value: "—" },
      { label: "추천 매출(7일)", value: "—" },
    ];
  }
  return [
    { label: "추천 노출(7일)", value: data.shownCount.toLocaleString() },
    { label: "추천 클릭률", value: formatRate(data.clickRate) },
    { label: "추천 전환율", value: formatRate(data.conversionRate) },
    { label: "추천 매출(7일)", value: `${data.revenue.toLocaleString()}원` },
  ];
}

export function AdminRecommendationsPage() {
  const [data, setData] = useState<RecommendationPerformance | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getRecommendationPerformance().then(setData).catch(() => setError(true));
  }, []);

  const items = data?.items ?? [];

  return (
    <AdminLayout title="AI 추천 관리" fullBleed>
      <div className={styles.page}>
        <p className={styles.caption}>item 기반 협업필터링 결과 · 콜드스타트는 룰 추천으로 대체</p>

        <div className={styles.kpis}>
          {kpis(data).map((k) => (
            <div key={k.label} className={styles.kCell}>
              <div className={styles.kLabel}>{k.label}</div>
              <div className={styles.kValue}>{k.value}</div>
            </div>
          ))}
        </div>

        <h2 className={styles.secHead} style={{ marginTop: 20 }}>추천 결과</h2>
        {error ? (
          <p className={styles.muted}>추천 성과를 불러오지 못했습니다.</p>
        ) : items.length === 0 ? (
          <p className={styles.muted}>추천 결과가 없습니다.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr><th>회원</th><th>추천 상품</th><th className={styles.num}>점수</th><th>사유</th><th>결과</th></tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const o = outcome(r);
                  return (
                    <tr key={r.recommendId}>
                      <td className={styles.name}>{r.userName}</td>
                      <td>{r.productName}</td>
                      <td className={styles.num}>{r.score.toFixed(2)}</td>
                      <td className={styles.reason}>{r.reason}</td>
                      <td><span className={`${styles.badge} ${o.cls}`}>{o.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
