import { useEffect, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import {
  getRecommendationPerformance,
  type RecommendationPerformance,
  type RecommendationResultItem,
} from "../../../api/adminRecommendations";
import sh from "../adminShared.module.css";

function outcome(result: RecommendationResultItem) {
  if (result.converted) return { label: "전환", cls: sh.bOk };
  if (result.clicked) return { label: "클릭", cls: sh.bInfo };
  if (result.shown) return { label: "노출", cls: sh.bMuted };
  return { label: "생성", cls: sh.bWarn };
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
    getRecommendationPerformance()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  return (
    <AdminLayout title="AI 추천 관리">
      <div className={sh.stats}>
        {kpis(data).map((k) => (
          <div key={k.label} className={sh.statCard}>
            <p className={sh.statLabel}>{k.label}</p>
            <p className={sh.statValue}>{k.value}</p>
          </div>
        ))}
      </div>

      <p className={sh.muted} style={{ marginBottom: "var(--space-3)" }}>
        item 기반 협업필터링 결과 · 콜드스타트는 룰 추천으로 대체
      </p>

      {error && <p className={sh.muted}>추천 성과를 불러오지 못했습니다.</p>}
      <div className={sh.list}>
        {(data?.items ?? []).map((r) => {
          const o = outcome(r);
          return (
            <Card key={r.recommendId}>
              <div className={sh.itemHead}>
                <span className={sh.itemTitle}>{r.userName}</span>
                <span className={`${sh.badge} ${o.cls}`}>{o.label}</span>
              </div>
              <p className={sh.itemMeta}>
                {r.productName} ({r.score.toFixed(2)})
              </p>
              <p className={sh.itemMeta}>{r.reason}</p>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
