import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { getChurnReport, type ChurnReport } from "../../../api/churnReport";
import styles from "./AdminChurnReportPage.module.css";

const ACTION_LABEL: Record<string, string> = {
  COUPON: "할인 쿠폰",
  PUSH: "푸시 알림",
  MODAL: "만류 모달",
  RECOMMEND: "맞춤 추천",
};

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

// 기간 프리셋 → from/to (YYYY-MM-DD). 전체는 undefined
const PERIODS = [
  { label: "최근 7일", days: 7 },
  { label: "최근 30일", days: 30 },
  { label: "전체", days: 0 },
];

function periodRange(days: number): { from?: string; to?: string } {
  if (!days) return {};
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

// 두 비율 z-검정 → 신뢰도 등급. 표본이 작거나 차이가 노이즈면 낮게 판정
type Reliability = { level: "high" | "mid" | "low"; label: string };
function reliability(x1: number, n1: number, x2: number, n2: number): Reliability {
  if (n1 < 30 || n2 < 30) return { level: "low", label: "표본 부족" };
  const p1 = x1 / n1, p2 = x2 / n2, p = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (se === 0) return { level: "low", label: "표본 부족" };
  const z = Math.abs(p1 - p2) / se;
  if (z >= 1.96) return { level: "high", label: "유의미" };       // 95% 신뢰
  if (z >= 1.28) return { level: "mid", label: "약한 신호" };     // 80%
  return { level: "low", label: "판단 보류" };
}

// 처치 vs 대조 이중 바 (재사용)
function DualBar({ label, meta, treatPct, controlPct, lift, maxPct, rel }: {
  label: string; meta: string; treatPct: number; controlPct: number; lift: number; maxPct: number; rel: Reliability;
}) {
  return (
    <div className={styles.liftRow}>
      <div>
        <div className={styles.liftName}>
          {label}
          <span className={`${styles.relBadge} ${styles["rel_" + rel.level]}`} title="처치군·대조군 표본으로 계산한 통계적 신뢰도">{rel.label}</span>
          <small>{meta}</small>
        </div>
        <div className={styles.dual}>
          <div className={styles.dualRow}>
            <span className={styles.tag}>처치</span>
            <span className={styles.dualTrack}><span className={`${styles.dualFill} ${styles.treatFill}`} style={{ width: `${(treatPct / maxPct) * 100}%` }} /></span>
            <span className={styles.dualPct}>{treatPct}%</span>
          </div>
          <div className={styles.dualRow}>
            <span className={styles.tag}>대조</span>
            <span className={styles.dualTrack}><span className={`${styles.dualFill} ${styles.controlFill}`} style={{ width: `${(controlPct / maxPct) * 100}%` }} /></span>
            <span className={styles.dualPct}>{controlPct}%</span>
          </div>
        </div>
      </div>
      <div className={styles.liftValue}>
        <b className={lift >= 0 ? styles.pos : styles.neg}>{lift >= 0 ? "+" : ""}{lift}</b>
        <small>%p</small>
      </div>
    </div>
  );
}

export function AdminChurnReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<ChurnReport | null>(null);
  const [period, setPeriod] = useState("전체");
  const [openAction, setOpenAction] = useState(true);
  const [openType, setOpenType] = useState(true);


  const load = useCallback((days: number) => {
    setLoading(true);
    setError(false);
    const { from, to } = periodRange(days);
    getChurnReport(from, to)
      .then(setData)
      .catch((err) => {
        console.error("대응 효과 리포트를 불러오지 못했습니다.", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(0); }, [load]);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.effect
      .map((e) => ({ ...e, lift: Math.round((e.treatPct - e.controlPct) * 10) / 10 }))
      .sort((a, b) => b.lift - a.lift);
  }, [data]);

  const typeRows = useMemo(() => {
    if (!data) return [];
    return data.typeEffect
      .map((e) => ({ ...e, lift: Math.round(((e.treatPct ?? 0) - (e.controlPct ?? 0)) * 10) / 10 }))
      .sort((a, b) => b.lift - a.lift);
  }, [data]);

  const best = rows[0];
  const worst = rows[rows.length - 1];
  const maxPct = Math.max(...rows.flatMap((r) => [r.treatPct, r.controlPct]), 1);
  const typeMaxPct = Math.max(...typeRows.flatMap((r) => [r.treatPct ?? 0, r.controlPct ?? 0]), 1);

  const kpi = data?.kpi;

  return (
    <AdminLayout title="대응 효과 리포트" fullBleed>
      {loading || error || !kpi ? (
        <div style={{ padding: 40 }}>
          <p className={styles.caption}>{loading ? "불러오는 중…" : "대응 효과 리포트를 불러오지 못했습니다."}</p>
        </div>
      ) : (
        <div className={styles.page}>
              {/* 넓은 영역: 기간 필터 → KPI → 인사이트 → 순효과 추이 */}
              <div className={styles.wide}>
                <div className={styles.pageHead}>
                  <p className={styles.caption}>대조군 대비 순효과로 본 대응 성과</p>
                  <div className={styles.period}>
                    {PERIODS.map((p) => (
                      <button key={p.label} className={period === p.label ? styles.on : ""} onClick={() => { setPeriod(p.label); load(p.days); }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.kpis}>
                  <div className={styles.kCell}><div className={styles.kLabel}>대응한 위험 고객</div><div className={styles.kValue}>{kpi.treated.toLocaleString()}명</div></div>
                  <div className={styles.kCell}><div className={styles.kLabel}>전환 (재구매)</div><div className={styles.kValue}>{kpi.conversions.toLocaleString()}명</div></div>
                  <div className={styles.kCell}><div className={styles.kLabel}>귀속 매출</div><div className={styles.kValue}>₩{kpi.revenue.toLocaleString()}</div></div>
                  <div className={styles.kCell}><div className={styles.kLabel}>방어한 이탈 (추정)</div><div className={styles.kValue}>{kpi.defended.toLocaleString()}명</div></div>
                </div>

                <div className={styles.wideBody}>
                <div className={styles.sec}>
                  <div className={styles.secHead}><h2>핵심 인사이트</h2></div>
                  {worst && worst.lift < 0 ? (
                    <div className={styles.insight}>
                      <span className={styles.insightIcon}>⚠</span>
                      <div>
                        <b>{ACTION_LABEL[worst.actionType] ?? worst.actionType}은 역효과입니다 ({worst.lift}%p)</b>
                        <p>처치군 전환율({worst.treatPct}%)이 대조군({worst.controlPct}%)보다 낮습니다. 이 채널은 오히려 이탈을 부추길 수 있어 대응 목록에서 제외를 검토하세요.</p>
                      </div>
                    </div>
                  ) : best && best.lift > 0 ? (
                    <div className={`${styles.insight} ${styles.good}`}>
                      <span className={styles.insightIcon}>✓</span>
                      <div>
                        <b>{ACTION_LABEL[best.actionType] ?? best.actionType}이 가장 효과적입니다 (+{best.lift}%p)</b>
                        <p>처치군 전환율이 대조군보다 {best.lift}%p 높습니다. 이 채널에 대응을 집중하는 것이 순효과가 큽니다.</p>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.caption}>표시할 인사이트가 없습니다.</p>
                  )}
                </div>

                <div className={styles.sec}>
                  <div className={styles.secHead}><h2>일별 대응·전환 추이</h2><p>{period === "전체" ? "최근 30일" : period} · 처치 발송 대비 전환</p></div>
                  {data.dailyTrend.length === 0 ? (
                    <div className={styles.trendPlaceholder}>해당 기간 대응 기록이 없습니다.</div>
                  ) : (
                    <>
                      <div className={styles.trendChart}>
                        {data.dailyTrend.map((d) => {
                          const max = Math.max(...data.dailyTrend.map((x) => x.sent), 1);
                          return (
                            <div key={d.day} className={styles.tBar} title={`${d.day} · 발송 ${d.sent} · 전환 ${d.converted}`}>
                              <span className={styles.tAmount}>{d.sent.toLocaleString()}</span>
                              <div className={styles.tTrack}>
                                <div className={styles.tSent} style={{ height: `${(d.sent / max) * 100}%` }} />
                                <div className={styles.tConv} style={{ height: `${(d.converted / max) * 100}%` }} />
                              </div>
                              <span className={styles.tLabel}>{d.day.slice(5)}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className={styles.tLegend}>
                        <span><i className={styles.tLegSent} />처치 발송</span>
                        <span><i className={styles.tLegConv} />전환</span>
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.sec}>
                  <div className={styles.secHead}><h2>쿠폰 ROI</h2><p>이탈 대응 자동발급 쿠폰 · 비용은 추정</p></div>
                  <table className={styles.roi}>
                    <thead>
                      <tr><th>쿠폰</th><th className={styles.r}>발급</th><th className={styles.r}>사용</th><th className={styles.r}>사용률</th><th className={styles.r}>추정 비용</th></tr>
                    </thead>
                    <tbody>
                      {data.couponRoi.map((c) => (
                        <tr key={c.name}>
                          <td>{c.name}</td>
                          <td className={styles.r}>{c.issued.toLocaleString()}</td>
                          <td className={styles.r}>{c.used.toLocaleString()}</td>
                          <td className={styles.r}>{c.issued > 0 ? Math.round((c.used / c.issued) * 100) : 0}%</td>
                          <td className={styles.r}>₩{c.estimatedCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {(() => {
                        const cost = data.couponRoi.reduce((a, c) => a + c.estimatedCost, 0);
                        const roi = cost > 0 ? Math.round((kpi.revenue / cost) * 10) / 10 : null;
                        return (
                          <tr>
                            <td>합계</td>
                            <td className={styles.r}>{data.couponRoi.reduce((a, c) => a + c.issued, 0).toLocaleString()}</td>
                            <td className={styles.r}>{data.couponRoi.reduce((a, c) => a + c.used, 0).toLocaleString()}</td>
                            <td className={styles.r}></td>
                            <td className={styles.r}>₩{cost.toLocaleString()}{roi !== null && <span className={styles.roiRatio}> · 귀속 매출 대비 {roi}배</span>}</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>

                <p className={styles.note}>
                  ※ 대조군(is_control) = 일부러 대응하지 않은 위험군. 처치군과의 전환율 차이가 대응의 진짜 기여도(순효과)입니다. 음수는 대응이 오히려 전환을 낮췄음을 뜻합니다.
                </p>
                </div>
              </div>

              {/* 좁은 영역: 액션별 · 위험 유형별 (접기/펼치기) */}
              <div className={styles.narrow}>
                <div className={styles.sec}>
                  <button type="button" className={styles.accHead} onClick={() => setOpenAction((v) => !v)} aria-expanded={openAction}>
                    <span className={styles.accBar} />
                    <span className={styles.accTitle}>액션별 순효과 <small>처치 vs 대조</small></span>
                    <span className={`${styles.accArrow} ${openAction ? styles.accArrowOpen : ""}`} />
                  </button>
                  <div className={`${styles.accBody} ${openAction ? styles.accOpen : ""}`}>
                    <div className={styles.accInner}>
                      <div className={styles.lift}>
                        {rows.map((e) => (
                          <DualBar key={e.actionType} label={ACTION_LABEL[e.actionType] ?? e.actionType}
                            meta={`전환 ${e.conv.toLocaleString()}명 · ₩${e.revenue.toLocaleString()}`}
                            treatPct={e.treatPct} controlPct={e.controlPct} lift={e.lift} maxPct={maxPct}
                            rel={reliability(e.conv, e.treatN, e.controlConv, e.controlN)} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.sec}>
                  <button type="button" className={styles.accHead} onClick={() => setOpenType((v) => !v)} aria-expanded={openType}>
                    <span className={styles.accBar} />
                    <span className={styles.accTitle}>위험 유형별 효과 <small>유형에 잘 먹힌 대응</small></span>
                    <span className={`${styles.accArrow} ${openType ? styles.accArrowOpen : ""}`} />
                  </button>
                  <div className={`${styles.accBody} ${openType ? styles.accOpen : ""}`}>
                    <div className={styles.accInner}>
                      <div className={styles.lift}>
                        {typeRows.map((e) => (
                          <DualBar key={e.riskType ?? "ML"} label={e.riskType ? RISK_TYPE_LABEL[e.riskType] ?? e.riskType : "ML 이탈 예측"}
                            meta={`대응 ${e.treated.toLocaleString()}명`}
                            treatPct={e.treatPct ?? 0} controlPct={e.controlPct ?? 0} lift={e.lift} maxPct={typeMaxPct}
                            rel={reliability(e.treatConv, e.treated, e.controlConv, e.controlN)} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
        </div>
      )}
    </AdminLayout>
  );
}
