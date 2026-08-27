import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { SkeletonRows } from "../../../components/Skeleton";
import { getAdminMembers, type AdminMemberResponse } from "../../../api/admin";
import styles from "../adminTable.module.css";

/*
 * 회원 관리는 "찾기" 화면이다. 목록을 훑는 게 아니라 특정 회원을 찾아 확인한다.
 * 그래서 검색을 앞세우고, 카드 대신 표를 쓴다(한 화면에 6~7명 → 15명 이상).
 *
 * 회원 데이터에 이미 위험도가 들어 있어서, 행을 누르면 이탈 고객 상세로 넘어간다.
 * 표시만 하고 끝나면 "위험한 회원을 찾았는데 그다음이 없는" 화면이 된다.
 */

const FILTERS = ["전체", "멤버십", "고위험"] as const;
type Filter = (typeof FILTERS)[number];

function riskTone(level: string) {
  if (level === "고위험") return styles.bRisk;
  if (level === "중위험") return styles.bWait;
  return styles.bDone;
}

function fmtDate(v: string) {
  if (!v) return "";
  const d = new Date(v);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AdminMembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<AdminMemberResponse[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("전체");
  const [sortBy, setSortBy] = useState("join_desc");
  // 회원 수가 많아 한 번에 다 그리면 느리다. 스크롤을 따라 20명씩 늘린다.
  const [visibleCount, setVisibleCount] = useState(30);
  const sentinelRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    getAdminMembers()
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((e) => { console.error("회원 리스트를 불러오지 못했습니다.", e); setMembers([]); });
  }, []);

  useEffect(() => { setVisibleCount(30); }, [q, filter, sortBy]);

  const sorted = useMemo(() => {
    if (!Array.isArray(members)) return [];
    const kw = q.trim();
    const rows = members.filter((m) => {
      if (filter === "멤버십" && m?.membershipType !== "멤버십") return false;
      if (filter === "고위험" && m?.riskLevel !== "고위험" && m?.riskLevel !== "HIGH") return false;
      if (!kw) return true;
      return (m?.name ?? "").includes(kw) || (m?.email ?? "").includes(kw);
    });
    return rows.sort((a, b) => {
      if (sortBy === "join_desc") return (b?.userId ?? 0) - (a?.userId ?? 0);
      if (sortBy === "join_asc") return (a?.userId ?? 0) - (b?.userId ?? 0);
      if (sortBy === "name_asc") return (a?.name || "").localeCompare(b?.name || "");
      if (sortBy === "risk_desc") return (b?.churnProbability ?? 0) - (a?.churnProbability ?? 0);
      return 0;
    });
  }, [members, q, filter, sortBy]);

  const shown = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  // 목록 끝의 빈 행이 보이면 다음 묶음을 그린다
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

  const loading = members === null;

  return (
    <AdminLayout title="회원 관리" fullBleed>
      <div className={styles.page}>
        <div className={styles.toolbar}>
          {/* 찾기가 목적이라 검색을 맨 앞에 넓게 둔다 */}
          <label className={`${styles.search} ${styles.searchWide}`}>
            <Search size={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 · 이메일 검색" />
          </label>

          <div className={styles.chips}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.chip} ${filter === f ? styles.chipOn : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <span className={styles.spacer} />
          <span className={styles.caption}>{loading ? "" : `${sorted.length.toLocaleString()}명`}</span>
          <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="join_desc">최신 가입순</option>
            <option value="join_asc">오래된 가입순</option>
            <option value="name_asc">이름순</option>
            <option value="risk_desc">위험도순</option>
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th style={{ width: 150 }}>이름</th>
                <th>이메일</th>
                <th style={{ width: 100 }}>구분</th>
                <th style={{ width: 150 }}>이탈 위험</th>
                <th style={{ width: 120 }}>가입일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={14} cols={5} widths={["54%", "76%", "50%", "62%", "70%"]} />
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    {(members?.length ?? 0) === 0 ? "회원이 없습니다." : "조건에 맞는 회원이 없습니다."}
                  </td>
                </tr>
              ) : (
                <>
                  {shown.map((m) => (
                    <tr
                      key={m.userId || Math.random()}
                      className={styles.rowLink}
                      onClick={() => navigate(`/admin/churn/customers/${m.userId}`)}
                      title="이탈 위험 상세 보기"
                    >
                      {/* 이동은 링크가 담당한다 — 행 onClick 만으로는 키보드로 도달할 수 없다 */}
                      <td className={styles.name}>
                        <Link
                          to={`/admin/churn/customers/${m.userId}`}
                          className={styles.cellLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {m.name || "이름없음"}
                        </Link>
                      </td>
                      <td><span className={styles.ellip}>{m.email || "-"}</span></td>
                      <td>
                        <span className={`${styles.badge} ${m.membershipType === "멤버십" ? styles.bInfo : styles.bMuted}`}>
                          {m.membershipType || "일반"}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${riskTone(m.riskLevel)}`}>{m.riskLevel || "저위험"}</span>
                        <span className={styles.num} style={{ marginLeft: 6 }}>{(m.churnProbability ?? 0).toFixed(2)}</span>
                      </td>
                      <td className={styles.num}>{fmtDate(m.createdAt)}</td>
                    </tr>
                  ))}
                  {hasMore && (
                    <tr ref={sentinelRef}>
                      <td colSpan={5} className={styles.loadMore}>더 불러오는 중…</td>
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
