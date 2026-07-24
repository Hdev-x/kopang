import { useEffect, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { ChurnSubnav } from "../../../components/ChurnSubnav";
import { Card } from "../../../components/Card";
import { getInterventionLogs, type InterventionLog } from "../../../api/interventions";
import sh from "../adminShared.module.css";

// outcome 코드 → 라벨·뱃지
const OUTCOME_LABEL: Record<string, string> = {
  CONVERTED: "전환",
  NO_RESPONSE: "미반응",
  CONTROL: "대조군",
};
function outcomeBadge(o: string) {
  if (o === "CONVERTED") return sh.bOk;
  if (o === "CONTROL") return sh.bMuted;
  return sh.bWarn; // NO_RESPONSE
}

// 액션·채널 코드 → 한글
const ACTION_LABEL: Record<string, string> = {
  COUPON: "할인 쿠폰",
  PUSH: "푸시 알림",
  MODAL: "만류 모달",
  RECOMMEND: "맞춤 추천",
};
const CHANNEL_LABEL: Record<string, string> = {
  PUSH: "푸시",
  EMAIL: "이메일",
  IN_APP: "앱",
};

// 탭 라벨 ↔ outcome 코드 (전체는 null)
const TABS: { label: string; code: string | null }[] = [
  { label: "전체", code: null },
  { label: "전환", code: "CONVERTED" },
  { label: "미반응", code: "NO_RESPONSE" },
  { label: "대조군", code: "CONTROL" },
];

export function AdminInterventionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [logs, setLogs] = useState<InterventionLog[]>([]);
  const [tab, setTab] = useState("전체");

  useEffect(() => {
    getInterventionLogs()
      .then(setLogs)
      .catch((err) => {
        console.error("대응 이력을 불러오지 못했습니다.", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCode = TABS.find((t) => t.label === tab)?.code ?? null;
  const rows = logs.filter((l) => (activeCode ? l.outcome === activeCode : true));

  return (
    <AdminLayout title="대응 이력">
      <ChurnSubnav />

      <div className={sh.toolbar}>
        <div className={sh.filters}>
          {TABS.map((t) => (
            <button
              key={t.label}
              className={`${sh.chip} ${tab === t.label ? sh.chipActive : ""}`}
              onClick={() => setTab(t.label)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className={sh.itemMeta}>불러오는 중…</p>
      ) : error ? (
        <p className={sh.itemMeta}>대응 이력을 불러오지 못했습니다.</p>
      ) : rows.length === 0 ? (
        <p className={sh.itemMeta}>해당 조건의 이력이 없습니다.</p>
      ) : (
        <div className={sh.list}>
          {rows.map((l, i) => (
            <Card key={i}>
              <div className={sh.itemHead}>
                <span className={sh.itemTitle}>
                  {l.userName}{" "}
                  <span className={`${sh.badge} ${l.isControl ? sh.bMuted : sh.bInfo}`}>
                    {l.isControl ? "대조군" : "처치군"}
                  </span>
                </span>
                <span className={`${sh.badge} ${outcomeBadge(l.outcome)}`}>
                  {OUTCOME_LABEL[l.outcome] ?? l.outcome}
                </span>
              </div>
              <p className={sh.itemMeta}>
                {ACTION_LABEL[l.actionType] ?? l.actionType} · {CHANNEL_LABEL[l.channel] ?? l.channel} ·{" "}
                {l.createdAt.slice(5, 10)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
