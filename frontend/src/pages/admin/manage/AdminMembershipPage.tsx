import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import sh from "../adminShared.module.css";

// 멤버십 = 이탈 방지의 간판 시나리오(해지 방어 + 일반→멤버십 전환)
const KPIS = [
  { label: "멤버십 회원", value: "580명" },
  { label: "이번달 신규", value: "42명" },
  { label: "해지 위험", value: "28명" },
  { label: "유지율", value: "91%" },
];
// 해지 위험 멤버십 (churn_score + 멤버십 신호). 대응은 자동 발송 → 상태만 표시.
const AT_RISK = [
  { name: "최유나", ends: "2026-07-15", score: 0.91, reason: "혜택 미사용 30일", action: "만류 쿠폰", status: "예정" },
  { name: "이영희", ends: "2026-07-08", score: 0.84, reason: "구매 급감", action: "갱신 할인", status: "발송됨" },
  { name: "강도현", ends: "2026-07-22", score: 0.58, reason: "로그인 감소", action: "혜택 안내", status: "대조군" },
];

function statusBadge(s: string) {
  if (s === "발송됨") return sh.bOk;
  if (s === "예정") return sh.bWarn;
  return sh.bMuted; // 대조군
}
// 일반 → 멤버십 전환(업셀)
const CONVERT = [
  { label: "전환 유도 노출", value: "1,240" },
  { label: "전환", value: "86명" },
  { label: "전환율", value: "6.9%" },
];

function scoreColor(s: number) {
  return s >= 0.7 ? "var(--color-danger)" : s >= 0.4 ? "var(--color-warning)" : "var(--color-success)";
}

export function AdminMembershipPage() {
  return (
    <AdminLayout title="멤버십 관리">
      <div className={sh.stats}>
        {KPIS.map((k) => (
          <div key={k.label} className={sh.statCard}>
            <p className={sh.statLabel}>{k.label}</p>
            <p className={sh.statValue}>{k.value}</p>
          </div>
        ))}
      </div>

      <h2 className={sh.sectionTitle}>해지 위험 멤버십</h2>
      <div className={sh.list}>
        {AT_RISK.map((m) => (
          <Card key={m.name}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>{m.name}</span>
              <strong style={{ color: scoreColor(m.score) }}>{m.score.toFixed(2)}</strong>
            </div>
            <p className={sh.itemMeta}>
              {m.reason} · 만료 {m.ends}
            </p>
            <div className={sh.itemBottom}>
              <span className={sh.itemMetaInline}>대응: {m.action}</span>
              <span className={`${sh.badge} ${statusBadge(m.status)}`}>{m.status}</span>
            </div>
          </Card>
        ))}
      </div>

      <h2 className={sh.sectionTitle}>일반 → 멤버십 전환 (업셀)</h2>
      <div className={sh.stats}>
        {CONVERT.map((c) => (
          <div key={c.label} className={sh.statCard}>
            <p className={sh.statLabel}>{c.label}</p>
            <p className={sh.statValue}>{c.value}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
