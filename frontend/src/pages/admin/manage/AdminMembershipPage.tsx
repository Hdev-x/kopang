import { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import { getAdminMembershipStats, type AdminMembershipStatsResponse } from "../../../api/admin";
import sh from "../adminShared.module.css";

function statusBadge(s: string) {
  if (s === "발송됨") return sh.bOk;
  if (s === "예정") return sh.bWarn;
  return sh.bMuted; // 대조군
}

function scoreColor(s: number) {
  return s >= 0.7 ? "var(--color-danger)" : s >= 0.4 ? "var(--color-warning)" : "var(--color-success)";
}

export function AdminMembershipPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminMembershipStatsResponse | null>(null);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");
  const [visibleCount, setVisibleCount] = useState(20);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const data = await getAdminMembershipStats();
      setStats(data);
    } catch (err) {
      console.error("멤버십 통계를 불러오는 데 실패했습니다.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 검색이나 정렬 조건 변경 시 무한 스크롤 초기화
  useEffect(() => {
    setVisibleCount(20);
  }, [q, sortBy]);

  // 무한 스크롤 감시자 등록
  useEffect(() => {
    if (loading || !stats) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 20);
        }
      },
      { rootMargin: "100px" }
    );
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
  }, [loading, stats, q, sortBy]);

  if (loading || !stats) {
    return (
      <AdminLayout title="멤버십 관리">
        <div style={{ textAlign: "center", padding: "80px", color: "var(--color-text-muted)" }}>로딩 중...</div>
      </AdminLayout>
    );
  }

  // 필터링 및 정렬
  const filteredMembers = stats.atRiskMembers.filter(
    (m) => m.name && m.name.includes(q)
  );

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === "score_desc") {
      return b.score - a.score;
    } else if (sortBy === "score_asc") {
      return a.score - b.score;
    } else if (sortBy === "name_asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    return 0;
  });

  const displayedMembers = sortedMembers.slice(0, visibleCount);

  const kpis = [
    { label: "멤버십 회원", value: `${stats.membershipCount.toLocaleString()}명` },
    { label: "이번달 신규", value: `${stats.newSubscribersThisMonth.toLocaleString()}명` },
    { label: "해지 위험", value: `${stats.atRiskCount.toLocaleString()}명` },
    { label: "유지율", value: `${stats.retentionRate}%` },
  ];

  const convert = [
    { label: "전환 유도 노출", value: "1,240" },
    { label: "전환", value: `${stats.newSubscribersThisMonth.toLocaleString()}명` },
    { label: "전환율", value: stats.membershipCount > 0 ? `${((stats.newSubscribersThisMonth / stats.membershipCount) * 100).toFixed(1)}%` : "0.0%" },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <AdminLayout title="멤버십 관리">
      <div className={sh.stats}>
        {kpis.map((k) => (
          <div key={k.label} className={sh.statCard}>
            <p className={sh.statLabel}>{k.label}</p>
            <p className={sh.statValue}>{k.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", marginBottom: "10px" }}>
        <h2 className={sh.sectionTitle} style={{ margin: 0 }}>해지 위험 멤버십</h2>
        <span className={sh.muted} style={{ fontSize: "13px" }}>총 {sortedMembers.length}명</span>
      </div>

      {/* 해지 위험 멤버십 검색 및 정렬 툴바 */}
      <div className={sh.toolbar} style={{ gap: "8px", marginBottom: "15px" }}>
        <Search size={16} color="var(--color-text-muted)" />
        <input
          className={sh.search}
          placeholder="이탈 회원 이름 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid var(--color-border, #eee)",
            fontSize: "12px",
            backgroundColor: "#fff",
            color: "var(--color-text)",
            cursor: "pointer",
            outline: "none"
          }}
        >
          <option value="score_desc">이탈률 높은순</option>
          <option value="score_asc">이탈률 낮은순</option>
          <option value="name_asc">이름순</option>
        </select>
      </div>

      <div className={sh.list}>
        {displayedMembers.length === 0 ? (
          <div className={sh.empty} style={{ border: "1px solid var(--color-border, #eee)", borderRadius: "var(--radius-md, 8px)" }}>
            감지된 해지 위험 멤버십 회원이 없습니다.
          </div>
        ) : (
          displayedMembers.map((m, idx) => (
            <Card key={idx}>
              <div className={sh.itemHead}>
                <span className={sh.itemTitle}>{m.name}</span>
                <strong style={{ color: scoreColor(m.score) }}>{m.score.toFixed(2)}</strong>
              </div>
              <p className={sh.itemMeta}>
                {m.reason} · 만료 {formatDate(m.ends)}
              </p>
              <div className={sh.itemBottom}>
                <span className={sh.itemMetaInline}>대응: {m.action}</span>
                <span className={`${sh.badge} ${statusBadge(m.status)}`}>{m.status}</span>
              </div>
            </Card>
          ))
        )}
        {visibleCount < sortedMembers.length && (
          <div ref={sentinelRef} style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            목록 불러오는 중...
          </div>
        )}
      </div>

      <h2 className={sh.sectionTitle}>일반 → 멤버십 전환 (업셀)</h2>
      <div className={sh.stats}>
        {convert.map((c) => (
          <div key={c.label} className={sh.statCard}>
            <p className={sh.statLabel}>{c.label}</p>
            <p className={sh.statValue}>{c.value}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
