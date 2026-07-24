import { useEffect, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { ChurnSubnav } from "../../../components/ChurnSubnav";
import { Card } from "../../../components/Card";
import { getChurnReport, type ChurnReport } from "../../../api/churnReport";
import sh from "../adminShared.module.css";

const ACTION_LABEL: Record<string, string> = {
  COUPON: "할인 쿠폰",
  PUSH: "푸시 알림",
  MODAL: "만류 모달",
  RECOMMEND: "맞춤 추천",
};

export function AdminChurnReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<ChurnReport | null>(null);

  useEffect(() => {
    getChurnReport()
      .then(setData)
      .catch((err) => {
        console.error("대응 효과 리포트를 불러오지 못했습니다.", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout title="대응 효과 리포트">
        <ChurnSubnav />
        <p className={sh.muted}>불러오는 중…</p>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="대응 효과 리포트">
        <ChurnSubnav />
        <p className={sh.muted}>대응 효과 리포트를 불러오지 못했습니다.</p>
      </AdminLayout>
    );
  }

  const { kpi, effect } = data;
  const kpis = [
    { label: "대응한 위험고객", value: `${kpi.treated.toLocaleString()}명` },
    { label: "전환(재구매)", value: `${kpi.conversions.toLocaleString()}명` },
    { label: "귀속 매출", value: `₩${kpi.revenue.toLocaleString()}` },
    { label: "방어한 이탈(추정)", value: `${kpi.defended.toLocaleString()}명` },
  ];

  return (
    <AdminLayout title="대응 효과 리포트">
      <ChurnSubnav />

      <div className={sh.stats}>
        {kpis.map((k) => (
          <div key={k.label} className={sh.statCard}>
            <p className={sh.statLabel}>{k.label}</p>
            <p className={sh.statValue}>{k.value}</p>
          </div>
        ))}
      </div>

      <h2 className={sh.sectionTitle}>액션별 순효과 (처치군 vs 대조군)</h2>
      <div className={sh.list}>
        {effect.map((e) => {
          const treat = e.treatPct ?? 0;
          const control = e.controlPct ?? 0;
          const lift = Math.round((treat - control) * 10) / 10;
          return (
            <Card key={e.actionType}>
              <div className={sh.itemHead}>
                <span className={sh.itemTitle}>{ACTION_LABEL[e.actionType] ?? e.actionType}</span>
                <strong style={{ color: lift >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                  {lift >= 0 ? "+" : ""}{lift}%p
                </strong>
              </div>
              <p className={sh.itemMeta}>
                처치 {treat}% · 대조 {control}%
              </p>
              <p className={sh.itemMeta}>
                전환 {e.conv.toLocaleString()}명 · 귀속매출 ₩{e.revenue.toLocaleString()}
              </p>
            </Card>
          );
        })}
      </div>

      <p className={sh.muted} style={{ marginTop: "var(--space-4)" }}>
        ※ 대조군(is_control) = 일부러 대응하지 않은 위험군. 처치군과의 전환율 차이가 진짜 기여도(순효과)다.
      </p>
    </AdminLayout>
  );
}
