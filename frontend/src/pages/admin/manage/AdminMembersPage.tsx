import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import { getAdminMembers, type AdminMemberResponse } from "../../../api/admin";
import sh from "../adminShared.module.css";

function riskBadge(r: string) {
  if (r === "고위험") return sh.bDanger;
  if (r === "중위험") return sh.bWarn;
  return sh.bOk;
}

export function AdminMembersPage() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<AdminMemberResponse[]>([]);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("join_desc");

  const loadData = async () => {
    try {
      const data = await getAdminMembers();
      setMembers(data);
    } catch (err) {
      console.error("회원 리스트를 불러오는 데 실패했습니다.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rows = members.filter(
    (m) =>
      (m.name && m.name.includes(q)) ||
      (m.email && m.email.includes(q))
  );

  const sortedRows = [...rows].sort((a, b) => {
    if (sortBy === "join_desc") {
      return b.userId - a.userId;
    } else if (sortBy === "join_asc") {
      return a.userId - b.userId;
    } else if (sortBy === "name_asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    return 0;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <AdminLayout title="회원 관리">
        <div style={{ textAlign: "center", padding: "80px", color: "var(--color-text-muted)" }}>로딩 중...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="회원 관리">
      <div className={sh.toolbar} style={{ gap: "8px" }}>
        <Search size={16} color="var(--color-text-muted)" />
        <input
          className={sh.search}
          placeholder="이름 / 이메일 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "8px var(--space-3, 12px)",
            borderRadius: "var(--radius-md, 6px)",
            border: "1px solid var(--color-border, #eee)",
            fontSize: "var(--font-xs, 12px)",
            backgroundColor: "#fff",
            color: "var(--color-text)",
            cursor: "pointer",
            outline: "none"
          }}
        >
          <option value="join_desc">최신 가입순</option>
          <option value="join_asc">오래된 가입순</option>
          <option value="name_asc">이름순</option>
        </select>
        <span className={sh.muted} style={{ fontSize: "13px", minWidth: "fit-content" }}>총 {rows.length}명</span>
      </div>

      <div className={sh.list}>
        {sortedRows.length === 0 ? (
          <div className={sh.empty} style={{ border: "1px solid var(--color-border, #eee)", borderRadius: "var(--radius-md, 8px)" }}>
            검색 결과에 맞는 회원이 없습니다.
          </div>
        ) : (
          sortedRows.map((m) => (
            <Card key={m.userId}>
              <div className={sh.itemHead}>
                <span className={sh.itemTitle}>
                  {m.name}{" "}
                  <span className={`${sh.badge} ${m.membershipType === "멤버십" ? sh.bInfo : sh.bMuted}`}>
                    {m.membershipType}
                  </span>
                </span>
                <span className={`${sh.badge} ${riskBadge(m.riskLevel)}`}>
                  {m.riskLevel} ({m.churnProbability.toFixed(2)})
                </span>
              </div>
              <p className={sh.itemMeta}>
                {m.email} · 가입 {formatDate(m.createdAt)}
              </p>
            </Card>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
