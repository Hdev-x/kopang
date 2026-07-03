import { AdminLayout } from "../components/AdminLayout";
import { ChurnSubnav } from "../components/ChurnSubnav";
import { Card } from "../components/Card";
import sh from "./adminShared.module.css";

// 목업 — intervention_outcome 집계 (처치군 vs 대조군 = 순효과)
const KPIS = [
  { label: "대응한 위험고객", value: "412명" },
  { label: "전환(재구매)", value: "128명" },
  { label: "귀속 매출", value: "₩2.62M" },
  { label: "방어한 이탈(추정)", value: "76명" },
];
const EFFECT = [
  { action: "맞춤 추천", treat: 34, control: 18, conv: 64, revenue: "₩1.26M" },
  { action: "할인 쿠폰", treat: 28, control: 16, conv: 41, revenue: "₩0.82M" },
  { action: "만류 모달", treat: 41, control: 22, conv: 23, revenue: "₩0.54M" },
];

export function AdminChurnReportPage() {
  return (
    <AdminLayout title="대응 효과 리포트">
      <ChurnSubnav />

      <div className={sh.stats}>
        {KPIS.map((k) => (
          <div key={k.label} className={sh.statCard}>
            <p className={sh.statLabel}>{k.label}</p>
            <p className={sh.statValue}>{k.value}</p>
          </div>
        ))}
      </div>

      <h2 className={sh.sectionTitle}>액션별 순효과 (처치군 vs 대조군)</h2>
      <div className={sh.list}>
        {EFFECT.map((e) => (
          <Card key={e.action}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>{e.action}</span>
              <strong style={{ color: "var(--color-success)" }}>+{e.treat - e.control}%p</strong>
            </div>
            <p className={sh.itemMeta}>
              처치 {e.treat}% · 대조 {e.control}%
            </p>
            <p className={sh.itemMeta}>
              전환 {e.conv}명 · 귀속매출 {e.revenue}
            </p>
          </Card>
        ))}
      </div>

      <p className={sh.muted} style={{ marginTop: "var(--space-4)" }}>
        ※ 대조군(is_control) = 일부러 대응하지 않은 위험군. 처치군과의 전환율 차이가 진짜 기여도(순효과)다.
      </p>
    </AdminLayout>
  );
}
