import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Crosshair, Percent, Target } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { getChurnSummary, type ChurnSummary } from "../../../api/churn";
import styles from "./AdminChurnPage.module.css";

// 주간 이탈률 목표(%) — 팀 목표치
const CHURN_TARGET = 4.0;

// ML 모델 스냅샷 (재학습 시 갱신)
const ML_MODEL_NOTE = "AUC 0.744 · 확률 보정 적용";

// 위험 유형 코드 → 라벨
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

function typeLabel(riskType: string | null) {
  return riskType ? RISK_TYPE_LABEL[riskType] ?? riskType : "ML 이탈 예측";
}

function pbClass(level: string) {
  return level === "HIGH" ? styles.pbHi : level === "MID" ? styles.pbMi : styles.pbLo;
}

// 차트 좌표계 (viewBox 고정, 점은 % 오버레이라 비율 무관)
const CW = 560;
const CH = 150;
const CPAD = 30;

export function AdminChurnPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChurnSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getChurnSummary()
      .then(setData)
      .catch((err) => {
        console.error("이탈 대시보드 집계를 불러오지 못했습니다.", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || error || !data) {
    return (
      <AdminLayout title="이탈 방지 대시보드">
        <p>{loading ? "집계를 불러오는 중…" : "집계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."}</p>
      </AdminLayout>
    );
  }

  const { kpi, levelCounts, typeCounts, weeklyChurnRate, atRisk, ops, mlCover, lastRuleRunAt } = data;
  const batchLabel = lastRuleRunAt ? `${lastRuleRunAt.slice(5, 10).replace("-", "/")} ${lastRuleRunAt.slice(11, 16)}` : "미실행";

  // KPI ─────────────────────────────────────────
  const highCount = levelCounts.find((l) => l.riskLevel === "HIGH")?.count ?? 0;
  const coveragePct = ops.highTotal > 0 ? Math.round((ops.highCovered / ops.highTotal) * 100) : 0;
  const uncovered = ops.highTotal - ops.highCovered;

  // 이탈률 추이 (최근 7일) ─────────────────────────
  const trend = weeklyChurnRate.slice(-7);
  const rates = trend.map((t) => t.churnRate);
  const yMax = Math.max(...rates, CHURN_TARGET) + 0.3;
  const yMin = Math.min(...rates, CHURN_TARGET) - 0.3;
  const x = (i: number) => CPAD + (i * (CW - CPAD * 2)) / Math.max(trend.length - 1, 1);
  const y = (v: number) => ((yMax - v) / (yMax - yMin)) * CH;
  const linePoints = trend.map((t, i) => `${x(i)},${y(t.churnRate)}`).join(" ");
  const areaPoints = `${linePoints} ${x(trend.length - 1)},${CH} ${x(0)},${CH}`;
  const targetY = y(CHURN_TARGET);
  const overDays = rates.filter((r) => r > CHURN_TARGET).length;
  const lastRate = rates.at(-1);
  const yTicks = [0.14, 0.47, 0.8].map((f) => ({ top: f * 100, value: (yMax - f * (yMax - yMin)).toFixed(1) }));
  const fmtDay = (iso: string, i: number) => (i === 0 ? `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}` : i === trend.length - 1 ? "오늘" : `${Number(iso.slice(8, 10))}`);

  // 위험 유형 분포 ────────────────────────────────
  const typeMax = Math.max(...typeCounts.map((t) => t.count), 1);

  // 룰 vs ML 밴드 — 소수 구간도 보이도록 최소 폭 확보(범례에 실수치)
  const mlSegs = [
    { key: "rule", count: mlCover.ruleOnly, cls: styles.segRule },
    { key: "both", count: mlCover.both, cls: styles.segBoth },
    { key: "ml", count: mlCover.mlOnly, cls: styles.segMl },
  ];

  return (
    <AdminLayout title="이탈 방지 대시보드" fullBleed>
      <div className={styles.page}>
        <div className={styles.pageHead}>
          <p className={styles.caption}>예측 → 대응 → 효과를 한눈에</p>
          <span className={styles.basis}>
            <i />집계 기준: 현재 상태 (고객별 최신 판정 1건) · 감지 배치 {batchLabel} · 기준은 임시
          </span>
        </div>

        {/* KPI 4 */}
        <div className={`${styles.fRow} ${styles.fKpis}`}>
          <div className={styles.fCell}>
            <span className={styles.kTop}><AlertTriangle size={14} className={styles.kIcon} color="#e4453a" /><span className={styles.label}>고위험 고객</span></span>
            <b className={styles.kValue}>{highCount.toLocaleString()}명</b>
            <span className={styles.kSub}>확률 0.7 이상</span>
          </div>
          <div className={styles.fCell}>
            <span className={styles.kTop}><Crosshair size={14} className={styles.kIcon} color="#2f6bff" /><span className={styles.label}>대응 커버리지</span></span>
            <b className={styles.kValue}>{coveragePct}%</b>
            <span className={styles.kSub}>{uncovered > 0 ? <span className={styles.neg}>미대응 {uncovered.toLocaleString()}명</span> : "고위험 전원 대응"}{uncovered > 0 && " → 발송 실행"}</span>
          </div>
          <div className={styles.fCell}>
            <span className={styles.kTop}><Percent size={14} className={styles.kIcon} color="#d98a06" /><span className={styles.label}>주간 이탈률</span></span>
            <b className={styles.kValue}>{kpi.churnRate}%</b>
            <span className={styles.kSub}>{kpi.churnRate <= CHURN_TARGET ? <span className={styles.pos}>목표 달성</span> : <span className={styles.neg}>목표 초과</span>} · 목표 {CHURN_TARGET.toFixed(1)}%</span>
          </div>
          <div className={styles.fCell}>
            <span className={styles.kTop}><Target size={14} className={styles.kIcon} color="#12a150" /><span className={styles.label}>대응 전환율</span></span>
            <b className={styles.kValue}>{kpi.conversionRate}%</b>
            <span className={styles.kSub}>처치군 재구매 기준 (7일 귀속)</span>
          </div>
        </div>

        {/* 추이 + 유형 분포 */}
        <div className={`${styles.fRow} ${styles.fMid}`}>
          <div className={styles.fCell}>
            <div className={styles.secHead}>
              <h2>이탈률 추이</h2>
              <p>최근 {trend.length}일 · 목표선 {CHURN_TARGET.toFixed(1)}%{overDays > 0 && <span className={`${styles.chip} ${styles.chipGood}`} style={{ marginLeft: 6, background: "#fce8e6", color: "#e4453a" }}>목표 초과 {overDays}일</span>}</p>
            </div>
            <div className={styles.chartWrap}>
              {yTicks.map((t) => (
                <span key={t.top} className={styles.yTick} style={{ top: `${t.top}%` }}>{t.value}</span>
              ))}
              <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" role="img" aria-label={`이탈률 최근 ${trend.length}일 추이`}>
                <defs>
                  <linearGradient id="churnFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#2f6bff" stopOpacity=".18" />
                    <stop offset="1" stopColor="#2f6bff" stopOpacity="0" />
                  </linearGradient>
                  <clipPath id="aboveTarget"><rect x="0" y="0" width={CW} height={targetY} /></clipPath>
                </defs>
                {yTicks.map((t) => (
                  <line key={t.top} x1="0" y1={(t.top / 100) * CH} x2={CW} y2={(t.top / 100) * CH} stroke="#e5e8ef" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                <line x1="0" y1={targetY} x2={CW} y2={targetY} stroke="#12a150" strokeWidth="1.5" strokeDasharray="5 4" opacity=".55" vectorEffect="non-scaling-stroke" />
                <polygon points={areaPoints} fill="url(#churnFill)" />
                <polyline points={linePoints} fill="none" stroke="#2f6bff" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <g clipPath="url(#aboveTarget)">
                  <polyline points={linePoints} fill="none" stroke="#e4453a" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </g>
              </svg>
              {trend.map((t, i) => {
                const isToday = i === trend.length - 1;
                const over = t.churnRate > CHURN_TARGET;
                return (
                  <i
                    key={t.metricDate}
                    className={`${styles.dot} ${over ? styles.dotCrit : ""} ${isToday ? styles.dotToday : ""}`}
                    style={{ left: `${(x(i) / CW) * 100}%`, top: `${(y(t.churnRate) / CH) * 100}%` }}
                    title={`${t.metricDate} · ${t.churnRate}%`}
                  />
                );
              })}
              {lastRate !== undefined && <span className={styles.todayBadge}>오늘 {lastRate}%</span>}
              <span className={styles.targetLabel} style={{ top: `${(targetY / CH) * 100}%` }}>목표 {CHURN_TARGET.toFixed(1)}%</span>
            </div>
            <div className={styles.xAxis}>
              {trend.map((t, i) => <span key={t.metricDate}>{fmtDay(t.metricDate, i)}</span>)}
            </div>
          </div>

          <div className={styles.fCell}>
            <div className={styles.secHead}>
              <h2>위험 유형 분포</h2>
              <p>최근 7일 감지 · 유형 중복 포함</p>
            </div>
            <div className={styles.hbars}>
              {typeCounts.map((t) => (
                <div key={t.riskType ?? "ML"} className={styles.hbar}>
                  <div className={styles.hbarMeta}>
                    <span>{typeLabel(t.riskType)}{!t.riskType && <span className={`${styles.chip} ${styles.chipMl}`} style={{ marginLeft: 6 }}>ML</span>}</span>
                    <b>{t.count.toLocaleString()}</b>
                  </div>
                  <div className={styles.hbarTrack}>
                    <span className={`${styles.hbarFill} ${!t.riskType ? styles.hbarFillMl : ""}`} style={{ width: `${(t.count / typeMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 대응 현황 + 룰vsML + Top3 */}
        <div className={`${styles.fRow} ${styles.fBot}`}>
          <div className={styles.fCell}>
            <div className={styles.secHead}>
              <h2>대응 현황</h2>
              <p><Link to="/admin/churn/interventions" className={styles.textLink}>이력 ›</Link></p>
            </div>
            <div className={styles.opsWrap}>
              <div className={styles.opsGrid}>
                <div className={styles.op}><span className={styles.label}>오늘 발송</span><b>{ops.sentToday.toLocaleString()}건</b><small>알림 {ops.sentPushToday} · 쿠폰 {ops.sentCouponToday}</small></div>
                <div className={styles.op}><span className={styles.label}>오늘 대조군</span><b>{ops.controlToday.toLocaleString()}명</b><small>효과 측정용 미발송</small></div>
                <div className={styles.op}><span className={styles.label}>누적 대응</span><b>{ops.totalCount.toLocaleString()}건</b><small>1일 1건 · 7일 중복 방지</small></div>
                <div className={styles.op}><span className={styles.label}>전환 (7일 귀속)</span><b>{ops.convertedCount.toLocaleString()}건</b><small>전환율 {kpi.conversionRate}%</small></div>
              </div>
              <div className={styles.cover}>
                <div className={styles.donut} style={{ background: `conic-gradient(#2f6bff 0 ${coveragePct}%, #fbfcfe ${coveragePct}% 100%)` }}>
                  <div className={styles.donutHole}>{coveragePct}%</div>
                </div>
                <div className={styles.coverMeta}>
                  <span className={styles.label}>고위험 커버리지</span>
                  <small>고위험 {ops.highTotal.toLocaleString()}명 중<br />처치·대조군 {ops.highCovered.toLocaleString()}명</small>
                </div>
              </div>
            </div>
            <div className={styles.opsFoot}>
              <small>다음 자동 발송: 스케줄러 편입 전 (수동 실행)</small>
              <Link to="/admin" className={styles.textLink}>통합 대시보드에서 발송 실행 →</Link>
            </div>
          </div>

          <div className={styles.fCell}>
            <div className={styles.secHead}>
              <h2>룰 vs ML 커버</h2>
              <p>룰 7일 · ML 30일 창</p>
            </div>
            <div className={styles.mlBand} role="img" aria-label={`감지 출처 구성: 룰만 ${mlCover.ruleOnly}, 동시 ${mlCover.both}, ML만 ${mlCover.mlOnly}`}>
              {mlSegs.map((s) => (
                <span key={s.key} className={s.cls} style={{ flexGrow: s.count, flexBasis: s.count > 0 ? "5%" : 0 }} />
              ))}
            </div>
            <ul className={styles.mlLegend}>
              <li><i style={{ background: "#2f6bff" }} />룰만 감지<b>{mlCover.ruleOnly.toLocaleString()}</b></li>
              <li><i style={{ background: "#12a150" }} />룰+ML 동시<b>{mlCover.both.toLocaleString()}</b></li>
              <li><i style={{ background: "#7a3ff2" }} />ML만 감지 (사각지대)<b className={styles.mlPurple}>{mlCover.mlOnly.toLocaleString()}</b></li>
            </ul>
            <div className={styles.mlInfo}>
              <div><span className={styles.label}>사각지대 대응</span><b>{mlCover.blindspotSent.toLocaleString()}건</b><small>ML 고위험 전용 발송</small></div>
              <div><span className={styles.label}>모델</span><b>{ML_MODEL_NOTE.split(" · ")[0]}</b><small>확률 보정 · 실행 {mlCover.lastMlRunAt ? mlCover.lastMlRunAt.slice(5, 10).replace("-", "/") : "—"}</small></div>
            </div>
            <p className={styles.mlNote}>ML만 감지 = 룰이 놓친 고객. 밴드의 소수 구간은 시인성 위해 최소 폭 표시.</p>
          </div>

          <div className={styles.fCell}>
            <div className={styles.secHead}>
              <h2>위험 고객 Top 3</h2>
              <p><Link to="/admin/churn/customers" className={styles.textLink}>전체 ›</Link></p>
            </div>
            <div>
              {atRisk.slice(0, 3).map((c) => (
                <Link key={c.userId} to={`/admin/churn/customers/${c.userId}`} className={styles.topRow}>
                  <span className={styles.av}>{c.name.slice(0, 1)}</span>
                  <span className={styles.topName}>
                    <b>{c.name}</b>
                    <small>{c.isMember ? "멤버십" : "일반"} · {typeLabel(c.riskType)}</small>
                  </span>
                  <span className={`${styles.pb} ${pbClass(c.riskLevel)}`}>{c.score.toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
