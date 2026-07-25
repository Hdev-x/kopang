import { useEffect, useState } from "react";
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
import { getChurnSummary, type ChurnSummary } from "../../../api/churn";
import sh from "../adminShared.module.css";
import styles from "./AdminChurnPage.module.css";

// 위험 등급 표시 메타 (HIGH/MID/LOW → 라벨·색·정렬순서)
const LEVEL_META: Record<string, { label: string; color: string; order: number }> = {
  HIGH: { label: "고위험", color: "var(--color-danger)", order: 0 },
  MID: { label: "중위험", color: "var(--color-warning)", order: 1 },
  LOW: { label: "저위험", color: "var(--color-success)", order: 2 },
};

// 대응 액션 한글 라벨
const ACTION_LABEL: Record<string, string> = {
  COUPON: "할인 쿠폰",
  PUSH: "푸시 알림",
  MODAL: "만류 모달",
  RECOMMEND: "맞춤 추천",
};

// 위험 유형 한글 라벨 (추천 대응 표시용)
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

const SEG_LABEL: Record<string, string> = { MEMBER: "멤버십 고객", NORMAL: "일반 고객" };
const CHURN_TARGET = 4.0;

function scoreColor(s: number) {
  if (s >= 0.7) return "var(--color-danger)";
  if (s >= 0.4) return "var(--color-warning)";
  return "var(--color-success)";
}

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

  if (loading) {
    return (
      <AdminLayout title="이탈 방지 대시보드">
        <ChurnSubnav />
        <p className={styles.caption}>집계를 불러오는 중…</p>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="이탈 방지 대시보드">
        <ChurnSubnav />
        <p className={styles.caption}>집계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      </AdminLayout>
    );
  }

  const { kpi, levelCounts, typeCounts, segments, weeklyChurnRate, effect, atRisk } = data;
  const typeMax = Math.max(...typeCounts.map((t) => t.count), 1);

  // KPI 4지표
  const kpiCards = [
    { icon: AlertTriangle, label: "고위험 고객", value: `${kpi.highRiskCount.toLocaleString()}명`, tone: "warn" as const },
    { icon: TrendingDown, label: "주간 이탈율", value: `${kpi.churnRate}%`, tone: "good" as const },
    { icon: Target, label: "대응 전환율", value: `${kpi.conversionRate}%`, tone: "good" as const },
    { icon: Coins, label: "대응 귀속 매출(일)", value: `₩${kpi.attributedRevenue.toLocaleString()}`, tone: "good" as const },
  ];

  // ① 위험도 분포 — HIGH/MID/LOW 순으로 정렬 + 표시 메타 결합
  const dist = levelCounts
    .map((l) => ({ ...l, meta: LEVEL_META[l.riskLevel] }))
    .sort((a, b) => a.meta.order - b.meta.order);
  const distTotal = dist.reduce((a, b) => a + b.count, 0);
  const stops = dist.reduce<{ parts: string[]; acc: number }>(
    (state, r) => {
      const start = (state.acc / distTotal) * 100;
      const next = state.acc + r.count;
      const end = (next / distTotal) * 100;
      return { parts: [...state.parts, `${r.meta.color} ${start}% ${end}%`], acc: next };
    },
    { parts: [], acc: 0 }
  ).parts.join(", ");

  const trendMax = Math.max(...weeklyChurnRate.map((t) => t.churnRate), CHURN_TARGET) * 1.1;
  const lastDate = weeklyChurnRate.at(-1)?.metricDate ?? "";

  return (
    <AdminLayout title="이탈 방지 대시보드">
      <ChurnSubnav />
      <p className={styles.caption}>예측 → 대응 → 효과를 한눈에 · 기준 {lastDate} (배치)</p>

      {/* KPI */}
      <div className={styles.kpiGrid}>
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <Icon size={16} className={styles.kpiIcon} />
                <span className={styles.kpiLabel}>{k.label}</span>
              </div>
              <p className={styles.kpiValue}>{k.value}</p>
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
            {dist.map((r) => (
              <li key={r.riskLevel}>
                <span className={styles.dot} style={{ background: r.meta.color }} />
                {r.meta.label}
                <strong>{r.count.toLocaleString()}명</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.typeSplit}>
          {segments.map((t) => (
            <div key={t.segment} className={styles.typeRow}>
              <span className={styles.typeName}>{SEG_LABEL[t.segment] ?? t.segment}</span>
              <span className={styles.typeMeta}>
                고위험 <strong>{t.high}</strong> / {t.total.toLocaleString()}명
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ①-c 위험 유형별 인원 — 현재 상태 기준(유저별 최신 1건), 집계 기준은 팀 확정 전 임시 */}
      <h2 className={styles.section}>①-c 위험 유형 분포</h2>
      <Card>
        <p className={sh.itemMeta} style={{ marginTop: 0 }}>현재 상태 기준 (고객별 최신 판정 1건) · 기준은 임시</p>
        <div className={styles.hbarList}>
          {typeCounts.map((t) => (
            <div key={t.riskType ?? "ML"} className={styles.hbarRow}>
              <span className={styles.hbarName}>
                {t.riskType ? RISK_TYPE_LABEL[t.riskType] ?? t.riskType : "ML 이탈 예측"}
              </span>
              <div className={styles.hbarTrack}>
                <span className={styles.hbarFill} style={{ width: `${(t.count / typeMax) * 100}%` }} />
              </div>
              <strong className={styles.hbarCount}>{t.count.toLocaleString()}명</strong>
            </div>
          ))}
        </div>
      </Card>

      {/* ② 이탈율 추이 */}
      <h2 className={styles.section}>② 주간 이탈율 추이</h2>
      <Card>
        <div className={styles.chart}>
          {weeklyChurnRate.map((t) => (
            <div key={t.metricDate} className={styles.bar}>
              <span className={styles.barValue}>{t.churnRate}%</span>
              <div className={styles.barFill} style={{ height: `${(t.churnRate / trendMax) * 100}%` }} />
              <span className={styles.barLabel}>{t.metricDate.slice(5)}</span>
            </div>
          ))}
        </div>
        <p className={styles.targetNote}>목표 {CHURN_TARGET}%</p>
      </Card>

      {/* ③ 대응 효과 (순효과) */}
      <h2 className={styles.section}>③ 대응 효과 (대조군 대비 순효과)</h2>
      <Card className={styles.effectCard}>
        {effect.map((e) => {
          const treat = e.treatPct ?? 0;
          const control = e.controlPct ?? 0;
          const lift = Math.round((treat - control) * 10) / 10;
          return (
            <div key={e.actionType} className={styles.effRow}>
              <div className={styles.effHead}>
                <span className={styles.effName}>{ACTION_LABEL[e.actionType] ?? e.actionType}</span>
                <span className={styles.effRevenue}>₩{e.revenue.toLocaleString()}</span>
              </div>
              <div className={styles.dualBar}>
                <div className={styles.dualTrack}>
                  <div className={styles.treatFill} style={{ width: `${treat}%` }} />
                </div>
                <span className={styles.dualPct}>처치 {treat}%</span>
              </div>
              <div className={styles.dualBar}>
                <div className={styles.dualTrack}>
                  <div className={styles.controlFill} style={{ width: `${control}%` }} />
                </div>
                <span className={styles.dualPct}>대조 {control}%</span>
              </div>
              <span className={styles.lift}>순효과 {lift >= 0 ? "+" : ""}{lift}%p</span>
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
        {atRisk.map((c) => (
          <Card key={c.userId}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>
                {c.name}{" "}
                <span className={`${sh.badge} ${c.isMember ? sh.bInfo : sh.bMuted}`}>
                  {c.isMember ? "멤버십" : "일반"}
                </span>
              </span>
              <strong style={{ color: scoreColor(c.score) }}>{c.score.toFixed(2)}</strong>
            </div>
            <p className={sh.itemMeta}>위험 유형: {RISK_TYPE_LABEL[c.riskType] ?? c.riskType}</p>
          </Card>
        ))}
      </div>

      <div className={styles.footHint}>
        <Users size={14} /> 데이터 출처: churn_score(예측) · churn_daily_metric(집계) · intervention_outcome(효과측정)
      </div>
    </AdminLayout>
  );
}
