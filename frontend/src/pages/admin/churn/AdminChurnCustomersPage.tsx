import { useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { ChurnSubnav } from "../components/ChurnSubnav";
import { Card } from "../components/Card";
import sh from "./adminShared.module.css";

// 목업 — churn_score + retention_intervention 조인. 대응은 시스템이 자동 발송 → 상태만 표시.
const CUSTOMERS = [
  { name: "최유나", type: "멤버십", score: 0.91, risk: "멤버십해지", action: "만류 쿠폰", status: "예정" },
  { name: "이영희", type: "멤버십", score: 0.84, risk: "주기단절", action: "맞춤 추천", status: "발송됨" },
  { name: "김민수", type: "일반", score: 0.79, risk: "장바구니방치", action: "리마인더", status: "발송됨" },
  { name: "정해인", type: "일반", score: 0.66, risk: "주기단절", action: "재구매 알림", status: "예정" },
  { name: "강도현", type: "멤버십", score: 0.58, risk: "혜택미사용", action: "혜택 안내", status: "대조군" },
  { name: "윤서아", type: "일반", score: 0.41, risk: "장바구니방치", action: "리마인더", status: "발송됨" },
];
const TYPES = ["전체", "일반", "멤버십"];
const LEVELS = ["전체", "고위험", "중위험"];

function levelOf(s: number) {
  return s >= 0.7 ? "고위험" : s >= 0.4 ? "중위험" : "저위험";
}
function scoreColor(s: number) {
  return s >= 0.7 ? "var(--color-danger)" : s >= 0.4 ? "var(--color-warning)" : "var(--color-success)";
}
function statusBadge(s: string) {
  if (s === "발송됨") return sh.bOk;
  if (s === "예정") return sh.bWarn;
  return sh.bMuted; // 대조군
}

export function AdminChurnCustomersPage() {
  const [type, setType] = useState("전체");
  const [level, setLevel] = useState("전체");
  const rows = CUSTOMERS.filter(
    (c) => (type === "전체" || c.type === type) && (level === "전체" || levelOf(c.score) === level)
  );

  return (
    <AdminLayout title="위험 고객 목록">
      <ChurnSubnav />

      <div className={sh.toolbar}>
        <div className={sh.filters}>
          {TYPES.map((t) => (
            <button key={t} className={`${sh.chip} ${type === t ? sh.chipActive : ""}`} onClick={() => setType(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className={sh.filters}>
          {LEVELS.map((l) => (
            <button key={l} className={`${sh.chip} ${level === l ? sh.chipActive : ""}`} onClick={() => setLevel(l)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className={sh.list}>
        {rows.map((c) => (
          <Card key={c.name}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>
                {c.name}{" "}
                <span className={`${sh.badge} ${c.type === "멤버십" ? sh.bInfo : sh.bMuted}`}>{c.type}</span>
              </span>
              <strong style={{ color: scoreColor(c.score) }}>
                {levelOf(c.score)} {c.score.toFixed(2)}
              </strong>
            </div>
            <div className={sh.itemBottom}>
              <span className={sh.itemMetaInline}>
                {c.risk} → {c.action}
              </span>
              <span className={`${sh.badge} ${statusBadge(c.status)}`}>{c.status}</span>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
