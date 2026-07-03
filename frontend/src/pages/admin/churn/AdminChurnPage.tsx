import { AdminLayout } from "../../../components/AdminLayout";
import { ChurnSubnav } from "../../../components/ChurnSubnav";
import { Card } from "../../../components/Card";
import {
  Users,
  TrendingDown,
  Target,
  Coins,
  AlertTriangle,
} from "lucide-react";
import sh from "../adminShared.module.css";
import styles from "./AdminChurnPage.module.css";

// ⚠️ 전부 목업 데이터 (실제론 churn_score / intervention_outcome / churn_daily_metric 집계)

// 상단 KPI — 닫힌 루프 4지표
const KPIS = [
  { icon: AlertTriangle, label: "고위험 고객", value: "143명", delta: "▲ 9 지난주", tone: "warn" as const },
  { icon: TrendingDown, label: "주간 이탈율", value: "4.2%", delta: "▼ 0.8%p", tone: "good" as const },
  { icon: Target, label: "대응 전환율", value: "31%", delta: "▲ 4%p", tone: "good" as const },
  { icon: Coins, label: "추천發 매출(월)", value: "₩2.1M", delta: "▲ 18%", tone: "good" as const },
];

// ① 위험도 분포 (전체)
const RISK_DIST = [
  { label: "고위험", count: 143, color: "var(--color-danger)" },
  { label: "중위험", count: 312, color: "var(--color-warning)" },
  { label: "저위험", count: 1945, color: "var(--color-success)" },
];
// 고객 유형별 고위험
const RISK_BY_TYPE = [
  { type: "일반 고객", high: 98, total: 1820 },
  { type: "멤버십 고객", high: 45, total: 580 },
];

// ② 주간 이탈율 추이 (%)
const CHURN_TREND = [
  { w: "5주전", v: 5.1 }, { w: "4주전", v: 4.9 }, { w: "3주전", v: 5.3 },
  { w: "2주전", v: 4.6 }, { w: "지난주", v: 4.4 }, { w: "이번주", v: 4.2 },
];
const CHURN_TARGET = 4.0;

// ③ 대응 효과 — 처치군 vs 대조군(무처치) 전환율 = 순효과(lift)
const EFFECT = [
  { action: "맞춤 추천", treat: 34, control: 18, revenue: "₩1.26M" },
  { action: "할인 쿠폰", treat: 28, control: 16, revenue: "₩820K" },
  { action: "만류 모달", treat: 41, control: 22, revenue: "₩540K" },
];

// ④ 위험 고객 목록 (예측 → 추천 대응)
const AT_RISK = [
  { name: "김민수", type: "멤버십", score: 0.87, action: "만류 쿠폰" },
  { name: "이지은", type: "일반", score: 0.79, action: "맞춤 추천" },
  { name: "박서준", type: "일반", score: 0.64, action: "재구매 알림" },
  { name: "최유나", type: "멤버십", score: 0.58, action: "혜택 안내" },
];

function scoreColor(s: number) {
  if (s >= 0.7) return "var(--color-danger)";
  if (s >= 0.4) return "var(--color-warning)";
  return "var(--color-success)";
}

export function AdminChurnPage() {
  const distTotal = RISK_DIST.reduce((a, b) => a + b.count, 0);
  // 도넛(conic-gradient) 구간 계산
  let acc = 0;
  const stops = RISK_DIST.map((r) => {
    const start = (acc / distTotal) * 100;
    acc += r.count;
    const end = (acc / distTotal) * 100;
    return `${r.color} ${start}% ${end}%`;
  }).join(", ");

  const trendMax = Math.max(...CHURN_TREND.map((t) => t.v), CHURN_TARGET) * 1.1;

  return (
    <AdminLayout title="이탈 방지 대시보드">
      <ChurnSubnav />
      <p className={styles.caption}>예측 → 대응 → 효과를 한눈에 · 기준 2026-06-30 09:00 (배치)</p>

      {/* KPI */}
      <div className={styles.kpiGrid}>
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <Icon size={16} className={styles.kpiIcon} />
                <span className={styles.kpiLabel}>{k.label}</span>
              </div>
              <p className={styles.kpiValue}>{k.value}</p>
              <span className={`${styles.kpiDelta} ${styles[k.tone]}`}>{k.delta}</span>
            </Card>
          );
        })}
      </div>

      {/* ① 위험도 분포 */}
      <h2 className={styles.section}>① 위험도 분포</h2>
      <Card className={styles.distCard}>
        <div className={styles.donutWrap}>
          <div className={styles.donut} style={{ background: `conic-gradient(${stops})` }}>
            <div className={styles.donutHole}>
              <strong>{distTotal.toLocaleString()}</strong>
              <span>관리 대상</span>
            </div>
          </div>
          <ul className={styles.legend}>
            {RISK_DIST.map((r) => (
              <li key={r.label}>
                <span className={styles.dot} style={{ background: r.color }} />
                {r.label}
                <strong>{r.count.toLocaleString()}명</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.typeSplit}>
          {RISK_BY_TYPE.map((t) => (
            <div key={t.type} className={styles.typeRow}>
              <span className={styles.typeName}>{t.type}</span>
              <span className={styles.typeMeta}>
                고위험 <strong>{t.high}</strong> / {t.total.toLocaleString()}명
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ② 이탈율 추이 */}
      <h2 className={styles.section}>② 주간 이탈율 추이</h2>
      <Card>
        <div className={styles.chart}>
          {CHURN_TREND.map((t) => (
            <div key={t.w} className={styles.bar}>
              <span className={styles.barValue}>{t.v}%</span>
              <div className={styles.barFill} style={{ height: `${(t.v / trendMax) * 100}%` }} />
              <span className={styles.barLabel}>{t.w}</span>
            </div>
          ))}
        </div>
        <p className={styles.targetNote}>목표 {CHURN_TARGET}% · 4주 연속 하락 중</p>
      </Card>

      {/* ③ 대응 효과 (순효과) */}
      <h2 className={styles.section}>③ 대응 효과 (대조군 대비 순효과)</h2>
      <Card className={styles.effectCard}>
        {EFFECT.map((e) => {
          const lift = e.treat - e.control;
          return (
            <div key={e.action} className={styles.effRow}>
              <div className={styles.effHead}>
                <span className={styles.effName}>{e.action}</span>
                <span className={styles.effRevenue}>{e.revenue}</span>
              </div>
              <div className={styles.dualBar}>
                <div className={styles.dualTrack}>
                  <div className={styles.treatFill} style={{ width: `${e.treat}%` }} />
                </div>
                <span className={styles.dualPct}>처치 {e.treat}%</span>
              </div>
              <div className={styles.dualBar}>
                <div className={styles.dualTrack}>
                  <div className={styles.controlFill} style={{ width: `${e.control}%` }} />
                </div>
                <span className={styles.dualPct}>대조 {e.control}%</span>
              </div>
              <span className={styles.lift}>순효과 +{lift}%p</span>
            </div>
          );
        })}
        <p className={styles.targetNote}>
          ※ 대조군(is_control) = 일부러 대응 안 한 위험군. 처치군과 전환율 차이 = 진짜 기여도
        </p>
      </Card>

      {/* ④ 위험 고객 목록 */}
      <h2 className={styles.section}>④ 위험 고객 목록</h2>
      <div className={sh.list}>
        {AT_RISK.map((c) => (
          <Card key={c.name}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>
                {c.name}{" "}
                <span className={`${sh.badge} ${c.type === "멤버십" ? sh.bInfo : sh.bMuted}`}>{c.type}</span>
              </span>
              <strong style={{ color: scoreColor(c.score) }}>{c.score.toFixed(2)}</strong>
            </div>
            <p className={sh.itemMeta}>추천 대응: {c.action}</p>
          </Card>
        ))}
      </div>

      <div className={styles.footHint}>
        <Users size={14} /> 데이터 출처: 이탈예측 ML(churn_score) · 추천 ML(item-CF) · 효과측정(intervention_outcome)
      </div>
    </AdminLayout>
  );
}
