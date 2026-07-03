import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import sh from "../adminShared.module.css";

// 목업 — recommendation_history 점검 (item-CF 결과 확인)
const KPIS = [
  { label: "추천 노출(주)", value: "18,400" },
  { label: "추천 클릭률", value: "9.2%" },
  { label: "추천 전환율", value: "3.1%" },
  { label: "추천發 매출(주)", value: "₩1.1M" },
];
const RECO = [
  { user: "이영희", item: "주방세제 리필", score: 0.92, reason: "함께 구매", click: true, buy: true },
  { user: "김민수", item: "제주 삼다수 2L x6", score: 0.88, reason: "구매 카테고리", click: true, buy: false },
  { user: "정해인", item: "USB-C 충전기 30W", score: 0.71, reason: "최근 본 상품", click: false, buy: false },
  { user: "윤서아", item: "유기농 오이 3입", score: 0.64, reason: "함께 구매", click: true, buy: true },
];

function outcome(r: { click: boolean; buy: boolean }) {
  if (r.buy) return { label: "전환", cls: sh.bOk };
  if (r.click) return { label: "클릭", cls: sh.bInfo };
  return { label: "노출", cls: sh.bMuted };
}

export function AdminRecommendationsPage() {
  return (
    <AdminLayout title="AI 추천 관리">
      <div className={sh.stats}>
        {KPIS.map((k) => (
          <div key={k.label} className={sh.statCard}>
            <p className={sh.statLabel}>{k.label}</p>
            <p className={sh.statValue}>{k.value}</p>
          </div>
        ))}
      </div>

      <p className={sh.muted} style={{ marginBottom: "var(--space-3)" }}>
        item 기반 협업필터링 결과 · 콜드스타트는 룰 추천으로 대체
      </p>

      <div className={sh.list}>
        {RECO.map((r, i) => {
          const o = outcome(r);
          return (
            <Card key={i}>
              <div className={sh.itemHead}>
                <span className={sh.itemTitle}>{r.user}</span>
                <span className={`${sh.badge} ${o.cls}`}>{o.label}</span>
              </div>
              <p className={sh.itemMeta}>
                {r.item} ({r.score.toFixed(2)})
              </p>
              <p className={sh.itemMeta}>{r.reason}</p>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
