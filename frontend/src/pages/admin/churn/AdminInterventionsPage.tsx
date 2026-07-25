import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { getInterventionLogs, type InterventionLog } from "../../../api/interventions";
import styles from "./AdminInterventionsPage.module.css";

const OUTCOME_LABEL: Record<string, string> = { CONVERTED: "전환", NO_RESPONSE: "미반응", CONTROL: "대조군" };
function outcomeBadge(o: string) {
  if (o === "CONVERTED") return styles.bOk;
  if (o === "CONTROL") return styles.bMuted;
  return styles.bWarn;
}

const ACTION_LABEL: Record<string, string> = {
  COUPON: "할인 쿠폰", PUSH: "푸시 알림", MODAL: "만류 모달", RECOMMEND: "맞춤 추천",
};
const CHANNEL_LABEL: Record<string, string> = { PUSH: "푸시", EMAIL: "이메일", IN_APP: "앱" };

const RISK_TYPE_LABEL: Record<string, string> = {
  CART_ABANDON: "장바구니 방치",
  MEMBERSHIP_CANCEL: "멤버십 해지",
  FIRST_ORDER_ONLY: "첫구매 미복귀",
  WISHLIST_IDLE: "찜 방치",
  COUPON_EXPIRING: "쿠폰 만료임박",
  BAD_EXPERIENCE: "부정경험",
  LOGIN_INACTIVE: "접속 뜸",
  SPENDING_DROP: "구매액 감소",
  ML_HIGH: "ML 고위험",
};

// 결과 필터 탭
const TABS: { label: string; code: string | null }[] = [
  { label: "전체", code: null },
  { label: "전환", code: "CONVERTED" },
  { label: "미반응", code: "NO_RESPONSE" },
  { label: "대조군", code: "CONTROL" },
];

const PAGE_SIZE = 20;

function fmtDateTime(iso: string) {
  return `${iso.slice(5, 10)} ${iso.slice(11, 16)}`;
}

export function AdminInterventionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [logs, setLogs] = useState<InterventionLog[]>([]);
  const [tab, setTab] = useState("전체");
  const [riskType, setRiskType] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    getInterventionLogs()
      .then(setLogs)
      .catch((err) => {
        console.error("대응 이력을 불러오지 못했습니다.", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // 요약: 전체 기준(필터 무관)
  const summary = useMemo(() => {
    const total = logs.length;
    const converted = logs.filter((l) => l.outcome === "CONVERTED").length;
    const noResp = logs.filter((l) => l.outcome === "NO_RESPONSE").length;
    const control = logs.filter((l) => l.outcome === "CONTROL").length;
    const treated = total - control;
    const convRate = treated > 0 ? Math.round((converted / treated) * 1000) / 10 : 0;
    return { total, converted, noResp, control, convRate };
  }, [logs]);

  const activeCode = TABS.find((t) => t.label === tab)?.code ?? null;
  const filtered = useMemo(
    () => logs.filter((l) => (activeCode ? l.outcome === activeCode : true)).filter((l) => (riskType ? l.riskType === riskType : true)),
    [logs, activeCode, riskType]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const resetPage = () => setPage(0);

  return (
    <AdminLayout title="대응 이력" fullBleed>
      <div className={styles.page}>
        <div className={styles.pageHead}>
          <p className={styles.caption}>대응 발송·경유 기록 로그 · 최근순</p>
        </div>

        {/* 요약 바 */}
        <div className={styles.summary}>
          <div className={styles.sumCell}>
            <span className={styles.lbl}>총 대응</span>
            <div className={styles.v}>{summary.total.toLocaleString()}건</div>
            <div className={styles.sub}>처치군 {(summary.total - summary.control).toLocaleString()} · 대조군 {summary.control.toLocaleString()}</div>
          </div>
          <div className={styles.sumCell}>
            <span className={styles.lbl}><i style={{ background: "#12a150" }} />전환</span>
            <div className={styles.v}>{summary.converted.toLocaleString()}건</div>
            <div className={styles.sub}>전환율 {summary.convRate}%</div>
          </div>
          <div className={styles.sumCell}>
            <span className={styles.lbl}><i style={{ background: "#d98a06" }} />미반응</span>
            <div className={styles.v}>{summary.noResp.toLocaleString()}건</div>
          </div>
          <div className={styles.sumCell}>
            <span className={styles.lbl}><i style={{ background: "#626d80" }} />대조군</span>
            <div className={styles.v}>{summary.control.toLocaleString()}건</div>
            <div className={styles.sub}>효과 측정용 미발송</div>
          </div>
        </div>

        {/* 필터 */}
        <div className={styles.filters}>
          <div className={styles.chips}>
            {TABS.map((t) => (
              <button key={t.label} className={`${styles.chip} ${tab === t.label ? styles.on : ""}`} onClick={() => { setTab(t.label); resetPage(); }}>
                {t.label}
              </button>
            ))}
          </div>
          <select className={styles.typeSelect} value={riskType} onChange={(e) => { setRiskType(e.target.value); resetPage(); }} aria-label="위험 유형">
            <option value="">위험 유형 전체</option>
            {Object.entries(RISK_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <span className={styles.count}>{filtered.length.toLocaleString()}건</span>
        </div>

        {/* 테이블 */}
        {loading ? (
          <p className={styles.empty}>불러오는 중…</p>
        ) : error ? (
          <p className={styles.empty}>대응 이력을 불러오지 못했습니다.</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>해당 조건의 이력이 없습니다.</p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.tbl}>
                <thead>
                  <tr><th>일시</th><th>고객</th><th>위험 유형</th><th>대응</th><th>채널</th><th>구분</th><th>결과</th></tr>
                </thead>
                <tbody>
                  {pageRows.map((l, i) => (
                    <tr key={safePage * PAGE_SIZE + i}>
                      <td className="num">{fmtDateTime(l.createdAt)}</td>
                      <td className={styles.name}>{l.userName}</td>
                      <td>{RISK_TYPE_LABEL[l.riskType] ?? l.riskType}</td>
                      <td>{ACTION_LABEL[l.actionType] ?? l.actionType}</td>
                      <td>{CHANNEL_LABEL[l.channel] ?? l.channel}</td>
                      <td><span className={`${styles.badge} ${l.isControl ? styles.bMuted : styles.bInfo}`}>{l.isControl ? "대조군" : "처치군"}</span></td>
                      <td><span className={`${styles.badge} ${outcomeBadge(l.outcome)}`}>{OUTCOME_LABEL[l.outcome] ?? l.outcome}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이저 */}
            <div className={styles.pager}>
              <span className={styles.rangeInfo}>{safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} / {filtered.length.toLocaleString()}건</span>
              {(() => {
                const GROUP = 5;
                const groupStart = Math.floor(safePage / GROUP) * GROUP;
                const groupEnd = Math.min(groupStart + GROUP, pageCount);
                return (
                  <div className={styles.pageBtns}>
                    <button onClick={() => setPage(Math.max(0, groupStart - GROUP))} disabled={groupStart === 0}>‹</button>
                    {Array.from({ length: groupEnd - groupStart }).map((_, idx) => {
                      const n = groupStart + idx;
                      return (
                        <button key={n} className={n === safePage ? styles.on : ""} onClick={() => setPage(n)}>{n + 1}</button>
                      );
                    })}
                    <button onClick={() => setPage(Math.min(pageCount - 1, groupStart + GROUP))} disabled={groupStart + GROUP >= pageCount}>›</button>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
