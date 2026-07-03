import { useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout } from "../components/AdminLayout";
import { Card } from "../components/Card";
import sh from "./adminShared.module.css";

const MEMBERS = [
  { id: 1, name: "홍길동", email: "hong@a.com", type: "일반", joined: "2026-01-12", risk: "저위험" },
  { id: 2, name: "김철수", email: "kim@a.com", type: "멤버십", joined: "2025-11-03", risk: "중위험" },
  { id: 3, name: "이영희", email: "lee@a.com", type: "멤버십", joined: "2025-08-21", risk: "고위험" },
  { id: 4, name: "박민수", email: "park@a.com", type: "일반", joined: "2026-03-30", risk: "저위험" },
  { id: 5, name: "최유나", email: "choi@a.com", type: "멤버십", joined: "2025-06-15", risk: "고위험" },
];

function riskBadge(r: string) {
  if (r === "고위험") return sh.bDanger;
  if (r === "중위험") return sh.bWarn;
  return sh.bOk;
}

export function AdminMembersPage() {
  const [q, setQ] = useState("");
  const rows = MEMBERS.filter((m) => m.name.includes(q) || m.email.includes(q));

  return (
    <AdminLayout title="회원 관리">
      <div className={sh.toolbar}>
        <Search size={16} color="var(--color-text-muted)" />
        <input
          className={sh.search}
          placeholder="이름 / 이메일 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className={sh.spacer} />
        <span className={sh.muted}>총 {rows.length}명</span>
      </div>

      <div className={sh.list}>
        {rows.map((m) => (
          <Card key={m.id}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>
                {m.name}{" "}
                <span className={`${sh.badge} ${m.type === "멤버십" ? sh.bInfo : sh.bMuted}`}>{m.type}</span>
              </span>
              <span className={`${sh.badge} ${riskBadge(m.risk)}`}>{m.risk}</span>
            </div>
            <p className={sh.itemMeta}>
              {m.email} · 가입 {m.joined}
            </p>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
