import { useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { ChurnSubnav } from "../components/ChurnSubnav";
import { Card } from "../components/Card";
import sh from "./adminShared.module.css";

// 목업 — retention_intervention + intervention_outcome 로그
const LOG = [
  { date: "06-30", user: "이영희", action: "맞춤 추천", channel: "푸시", control: false, outcome: "전환" },
  { date: "06-30", user: "김민수", action: "리마인더", channel: "앱", control: false, outcome: "미반응" },
  { date: "06-29", user: "최유나", action: "만류 모달", channel: "앱", control: false, outcome: "전환" },
  { date: "06-29", user: "정해인", action: "재구매 알림", channel: "푸시", control: true, outcome: "대조군" },
  { date: "06-28", user: "강도현", action: "할인 쿠폰", channel: "이메일", control: false, outcome: "클릭" },
  { date: "06-28", user: "윤서아", action: "리마인더", channel: "앱", control: true, outcome: "대조군" },
];
const TABS = ["전체", "전환", "미반응", "대조군"];

function outcomeBadge(o: string) {
  if (o === "전환") return sh.bOk;
  if (o === "클릭") return sh.bInfo;
  if (o === "대조군") return sh.bMuted;
  return sh.bWarn;
}

export function AdminInterventionsPage() {
  const [tab, setTab] = useState("전체");
  const rows = LOG.filter((l) => {
    if (tab === "전체") return true;
    if (tab === "대조군") return l.control;
    return l.outcome === tab;
  });

  return (
    <AdminLayout title="대응 이력">
      <ChurnSubnav />

      <div className={sh.toolbar}>
        <div className={sh.filters}>
          {TABS.map((t) => (
            <button key={t} className={`${sh.chip} ${tab === t ? sh.chipActive : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={sh.list}>
        {rows.map((l, i) => (
          <Card key={i}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>
                {l.user}{" "}
                <span className={`${sh.badge} ${l.control ? sh.bMuted : sh.bInfo}`}>
                  {l.control ? "대조군" : "처치군"}
                </span>
              </span>
              <span className={`${sh.badge} ${outcomeBadge(l.outcome)}`}>{l.outcome}</span>
            </div>
            <p className={sh.itemMeta}>
              {l.action} · {l.channel} · {l.date}
            </p>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
