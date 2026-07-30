import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Skeleton, SkeletonRows } from "../../../components/Skeleton";
import { getAdminMembershipStats, type AdminMembershipStatsResponse } from "../../../api/admin";
import styles from "../adminTable.module.css";

/*
 * 멤버십은 데이터 자체가 통계다(회원 수·신규·해지 위험·유지율).
 * 그래서 요약을 두는 게 흉내가 아니라 성격에 맞다. 아래는 "대응이 필요한 사람" 목록이다.
 * 위쪽에서 현황을 보고, 아래에서 바로 조치할 대상을 찾는 흐름.
 */

function statusTone(s: string) {
  if (s === "발송됨") return styles.bDone;
  if (s === "예정") return styles.bWait;
  return styles.bMuted;   // 대조군 — 일부러 발송하지 않은 집단
}

function scoreTone(score: number) {
  if (score >= 0.7) return styles.bRisk;
  if (score >= 0.4) return styles.bWait;
  return styles.bDone;
}

function fmtDate(v: string) {
  if (!v) return "";
  const d = new Date(v);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AdminMembershipPage() {
  const [stats, setStats] = useState<AdminMembershipStatsResponse | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");
  const [visibleCount, setVisibleCount] = useState(30);
  const sentinelRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    getAdminMembershipStats()
      .then(setStats)
      .catch((e) => {
        // 실패를 그냥 두면 자리표시자가 투명해서 빈 화면이 영원히 남는다
        console.error("멤버십 통계를 불러오지 못했습니다.", e);
        setError(true);
      });
  }, []);

  useEffect(() => { setVisibleCount(30); }, [q, sortBy]);

  const sorted = useMemo(() => {
    const rows = (stats?.atRiskMembers ?? []).filter((m) => !q.trim() || (m.name ?? "").includes(q.trim()));
    return [...rows].sort((a, b) => {
      if (sortBy === "score_desc") return (b.score ?? 0) - (a.score ?? 0);
      if (sortBy === "score_asc") return (a.score ?? 0) - (b.score ?? 0);
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });
  }, [stats, q, sortBy]);

  const shown = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((n) => n + 20); },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown.length]);

  const loading = stats === null && !error;

  const kpis = [
    { label: "멤버십 회원", value: stats && `${stats.membershipCount.toLocaleString()}명`, sub: "구독 중" },
    { label: "이번 달 신규", value: stats && `${stats.newSubscribersThisMonth.toLocaleString()}명`, sub: "신규 구독" },
    { label: "해지 위험", value: stats && `${stats.atRiskCount.toLocaleString()}명`, sub: "대응 대상" },
    { label: "유지율", value: stats && `${stats.retentionRate}%`, sub: "최근 기준" },
  ];

  return (
    <AdminLayout title="멤버십 관리" fullBleed>
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <p className={styles.caption}>구독 현황과 해지 위험 회원</p>
        </div>

        <div className={styles.kpis}>
          {kpis.map((k) => (
            <div key={k.label} className={styles.kCell}>
              <div className={styles.kLabel}>{k.label}</div>
              <div className={styles.kValue}>{k.value ?? (error ? "—" : <Skeleton w={88} h={22} />)}</div>
              <div className={styles.kSub}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div className={`${styles.toolbar} ${styles.sectionGap}`}>
          <strong className={styles.sectionTitle}>해지 위험 멤버십</strong>
          <span className={styles.caption}>{loading ? "" : `${sorted.length.toLocaleString()}명`}</span>
          <span className={styles.spacer} />
          <label className={styles.search}>
            <Search size={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 검색" />
          </label>
          <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="score_desc">위험도 높은순</option>
            <option value="score_asc">위험도 낮은순</option>
            <option value="name_asc">이름순</option>
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th style={{ width: 140 }}>회원</th>
                <th style={{ width: 100 }}>위험도</th>
                <th>감지 사유</th>
                <th style={{ width: 160 }}>대응</th>
                <th style={{ width: 100 }}>발송</th>
                <th style={{ width: 120 }}>만료일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={10} cols={6} widths={["58%", "44%", "72%", "62%", "48%", "70%"]} />
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    {error
                      ? "멤버십 통계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
                      : sorted.length === 0 && q ? "조건에 맞는 회원이 없습니다." : "감지된 해지 위험 회원이 없습니다."}
                  </td>
                </tr>
              ) : (
                <>
                  {shown.map((m, i) => (
                    <tr key={`${m.name}-${i}`}>
                      <td className={styles.name}>{m.name}</td>
                      <td><span className={`${styles.badge} ${scoreTone(m.score ?? 0)}`}>{(m.score ?? 0).toFixed(2)}</span></td>
                      <td><span className={styles.ellip}>{m.reason}</span></td>
                      <td>{m.action}</td>
                      <td><span className={`${styles.badge} ${statusTone(m.status)}`}>{m.status}</span></td>
                      <td className={styles.num}>{fmtDate(m.ends)}</td>
                    </tr>
                  ))}
                  {hasMore && (
                    <tr ref={sentinelRef}>
                      <td colSpan={6} className={styles.loadMore}>더 불러오는 중…</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
