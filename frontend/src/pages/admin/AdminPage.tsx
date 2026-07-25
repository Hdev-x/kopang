import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Send,
  Sigma,
  UsersRound,
  Wallet,
} from "lucide-react";
import { AdminLayout } from "../../components/AdminLayout";
import { getSalesStats, type SalesStats } from "../../api/adminSales";
import {
  getChurnSummary,
  getInterventionPreview,
  runCouponExpiringIntervention,
  runIntervention,
  runLoginInactiveIntervention,
  type ChurnSummary,
  type InterventionPreview,
} from "../../api/churn";
import { getAdminOrders, type Order } from "../../api/order";
import styles from "./AdminPage.module.css";

// 큰 금액 축약 (억/만 단위)
function fmtShort(n: number) {
  if (n >= 1_0000_0000) return (n / 1_0000_0000).toFixed(n >= 10_0000_0000 ? 0 : 1) + "억";
  if (n >= 1_0000) return Math.round(n / 1_0000).toLocaleString() + "만";
  return n.toLocaleString();
}

// 위험 등급 표시 메타 (HIGH/MID/LOW) — 시안 팔레트
const RISK_META: Record<string, { label: string; color: string }> = {
  HIGH: { label: "고위험", color: "#e4453a" },
  MID: { label: "중위험", color: "#d98a06" },
  LOW: { label: "저위험", color: "#12a150" },
};

// 주문 상태 → 라벨·배지 톤 (AdminOrdersPage와 같은 기준)
function orderStatusMeta(o: Order): { label: string; tone: "ready" | "shipping" | "done" } {
  if (o.orderStatus === "SHIPPING") return { label: "배송중", tone: "shipping" };
  if (o.orderStatus === "DELIVERED") return { label: "배송완료", tone: "done" };
  if (o.orderStatus === "CONFIRMED") return { label: "구매확정", tone: "done" };
  if (o.orderStatus === "CANCELLED") return { label: "취소", tone: "ready" };
  if (o.paymentStatus === "PAID") return { label: "결제완료", tone: "ready" };
  return { label: "상품준비", tone: "ready" };
}

const QUICK_LINKS = [
  { to: "/admin/products", label: "상품 등록·관리", description: "판매 상품과 재고를 관리합니다.", icon: Boxes },
  { to: "/admin/orders", label: "주문·배송 처리", description: "신규 주문과 배송 상태를 확인합니다.", icon: ClipboardList },
  { to: "/admin/members", label: "회원 관리", description: "회원 정보와 활동 상태를 조회합니다.", icon: UsersRound },
];

// 액션센터 발송 3갈래 정의 — run은 실행 후 결과 문구를 돌려준다
const ACTIONS: {
  key: keyof InterventionPreview;
  label: string;
  description: string;
  tone: "crit" | "warn" | "info";
  run: () => Promise<string>;
}[] = [
  {
    key: "integratedCount",
    label: "통합 발송",
    description: "첫구매 후 미복귀 (대조군·상한 적용)",
    tone: "crit",
    run: async () => {
      const r = await runIntervention();
      return `발송 ${r.sentCount}건 · 대조군/제외 ${r.controlCount}건 (대상 ${r.targetCount}명)`;
    },
  },
  {
    key: "couponExpiringCount",
    label: "쿠폰 만료 임박",
    description: "미사용 쿠폰 리마인드 (전원 발송)",
    tone: "warn",
    run: async () => {
      await runCouponExpiringIntervention();
      return "발송 완료";
    },
  },
  {
    key: "loginInactiveCount",
    label: "미로그인 복귀 유도",
    description: "30일 미로그인 + 복귀 쿠폰",
    tone: "info",
    run: async () => {
      await runLoginInactiveIntervention();
      return "발송 완료";
    },
  },
];

export function AdminPage() {
  const [sales, setSales] = useState<SalesStats | null>(null);
  const [churn, setChurn] = useState<ChurnSummary | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [preview, setPreview] = useState<InterventionPreview | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const loadPreview = useCallback(() => {
    getInterventionPreview().then(setPreview).catch((e) => console.error("발송 대상 현황 로드 실패", e));
  }, []);

  useEffect(() => {
    getSalesStats().then(setSales).catch((e) => console.error("매출 통계 로드 실패", e));
    getChurnSummary().then(setChurn).catch((e) => console.error("이탈 요약 로드 실패", e));
    getAdminOrders().then((list) => setOrders(list.slice(0, 4))).catch((e) => console.error("최근 주문 로드 실패", e));
    loadPreview();
  }, [loadPreview]);

  // 발송 실행 — 실제 알림·쿠폰이 나가므로 확인 후 실행, 완료 후 대상 현황 갱신
  const handleRun = async (action: (typeof ACTIONS)[number]) => {
    const count = preview?.[action.key] ?? 0;
    if (!window.confirm(`${action.label} 대상 ${count.toLocaleString()}명에게 발송을 실행할까요?\n알림·쿠폰이 실제로 발급됩니다.`)) return;
    setRunning(action.key);
    try {
      const message = await action.run();
      setResults((prev) => ({ ...prev, [action.key]: message }));
      loadPreview();
    } catch (e) {
      console.error(`${action.label} 실행 실패`, e);
      setResults((prev) => ({ ...prev, [action.key]: "실행 실패 — 콘솔 확인" }));
    } finally {
      setRunning(null);
    }
  };

  const weekly = sales?.weeklySales ?? [];
  const weekMax = Math.max(...weekly.map((w) => w.amount), 1);
  const weekTotal = weekly.reduce((a, w) => a + w.amount, 0);

  // 오늘 매출 전일 대비 증감률 — 주간 추이의 마지막 두 점으로 계산 (시안 delta)
  let todayDelta: number | null = null;
  if (weekly.length >= 2) {
    const prev = weekly[weekly.length - 2].amount;
    if (prev > 0) todayDelta = ((weekly[weekly.length - 1].amount - prev) / prev) * 100;
  }

  // 상단 KPI 4개 (시안 A-1) — 이탈 고위험은 도넛·액션센터에서 표시
  const stats = [
    {
      label: "오늘 매출",
      value: sales ? `${fmtShort(sales.todaySales)}원` : "—",
      icon: CircleDollarSign,
      sub: todayDelta === null ? null : `${todayDelta >= 0 ? "▲" : "▼"} 전일 대비 ${Math.abs(todayDelta).toFixed(1)}%`,
      subTone: todayDelta !== null && todayDelta >= 0 ? "up" : "down",
    },
    { label: "이번 달 매출", value: sales ? `${fmtShort(sales.monthSales)}원` : "—", icon: Wallet, sub: null, subTone: "" },
    { label: "총 매출", value: sales ? `${fmtShort(sales.totalSales)}원` : "—", icon: Sigma, sub: "누적 결제 완료", subTone: "" },
    {
      label: "오늘 주문",
      value: sales ? `${sales.todayOrders.toLocaleString()}건` : "—",
      icon: ClipboardList,
      sub: sales ? `신규 회원 ${sales.newMembers.toLocaleString()}명` : null,
      subTone: "",
    },
  ];

  // 이탈 위험 분포 → 도넛(conic-gradient) 구간 계산
  const dist = churn?.levelCounts ?? [];
  const distTotal = dist.reduce((a, d) => a + d.count, 0) || 1;
  const counts = { HIGH: 0, MID: 0, LOW: 0, ...Object.fromEntries(dist.map((d) => [d.riskLevel, d.count])) } as Record<string, number>;
  const highPct = (counts.HIGH / distTotal) * 100;
  const midEnd = highPct + (counts.MID / distTotal) * 100;
  const donutBg = `conic-gradient(${RISK_META.HIGH.color} 0 ${highPct}%, ${RISK_META.MID.color} ${highPct}% ${midEnd}%, ${RISK_META.LOW.color} ${midEnd}% 100%)`;

  const actionTotal = preview ? preview.integratedCount + preview.couponExpiringCount + preview.loginInactiveCount : null;

  return (
    <AdminLayout title="통합 대시보드">
      <div className={styles.a1Grid}>
        <div className={styles.mainCol}>
          <section className={styles.stats} aria-label="오늘의 운영 현황">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article key={stat.label} className={styles.statCard}>
                  <div className={styles.kpiTop}>
                    <span className={styles.kpiIcon}><Icon size={15} /></span>
                    <p className={styles.statLabel}>{stat.label}</p>
                  </div>
                  <strong className={styles.statValue}>{stat.value}</strong>
                  {stat.sub && <span className={`${styles.delta} ${stat.subTone === "up" ? styles.up : stat.subTone === "down" ? styles.down : ""}`}>{stat.sub}</span>}
                </article>
              );
            })}
          </section>

          <div className={styles.aTwo}>
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h2>주간 매출 추이</h2>
                  <p>최근 7일 결제 완료 기준</p>
                </div>
                <strong className={styles.total}>{fmtShort(weekTotal)}</strong>
              </div>
              <div className={styles.chart}>
                {weekly.length === 0 ? (
                  <p className={styles.statLabel}>데이터를 불러오는 중…</p>
                ) : (
                  weekly.map((w) => (
                    <div key={w.date} className={styles.bar}>
                      <span className={styles.barAmount}>{fmtShort(w.amount)}</span>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ height: `${(w.amount / weekMax) * 100}%` }} />
                      </div>
                      <span className={styles.barLabel}>{w.date.slice(5)}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h2>이탈 위험 분포</h2>
                  <p>전체 분석 대상 {distTotal.toLocaleString()}명</p>
                </div>
                <Link to="/admin/churn" className={styles.textLink}>상세 <ChevronRight size={15} /></Link>
              </div>
              <div className={styles.donutWrap}>
                <div className={styles.donut} style={{ background: donutBg }}>
                  <div className={styles.donutHole}>
                    <b>{counts.HIGH.toLocaleString()}</b>
                    <span>고위험</span>
                  </div>
                </div>
                <ul className={styles.legend}>
                  {(["HIGH", "MID", "LOW"] as const).map((lv) => (
                    <li key={lv}>
                      <i style={{ background: RISK_META[lv].color }} />
                      {RISK_META[lv].label}
                      <b>{(counts[lv] ?? 0).toLocaleString()}</b>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h2>최근 주문</h2>
                <p>새로 접수된 주문 현황</p>
              </div>
              <Link to="/admin/orders" className={styles.textLink}>전체 주문 <ChevronRight size={15} /></Link>
            </div>
            <div className={styles.orderTable}>
              <div className={styles.orderHeader}><span>주문번호</span><span>주문자</span><span>결제금액</span><span>상태</span></div>
              {orders === null ? (
                <p className={styles.statLabel}>데이터를 불러오는 중…</p>
              ) : orders.length === 0 ? (
                <p className={styles.statLabel}>최근 주문이 없습니다.</p>
              ) : (
                orders.map((o) => {
                  const meta = orderStatusMeta(o);
                  return (
                    <div key={o.orderId} className={styles.orderRow}>
                      <strong>C{String(o.orderId).padStart(5, "0")}</strong>
                      <span>{o.userName ?? `회원 ${o.userId}`}</span>
                      <span>{o.totalPrice.toLocaleString()}원</span>
                      <span className={`${styles.status} ${styles[meta.tone]}`}>{meta.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className={styles.rail}>
          <section className={styles.panel}>
            <div className={styles.railHead}>
              <span className={styles.railLabel}>오늘 처리할 일</span>
              {actionTotal !== null && actionTotal > 0 && <span className={styles.critChip}>{actionTotal.toLocaleString()}</span>}
            </div>
            <div className={styles.actionList}>
              {ACTIONS.map((action) => {
                const count = preview?.[action.key];
                const result = results[action.key];
                return (
                  <div key={action.key} className={styles.actionItem}>
                    <span className={`${styles.actionIcon} ${styles[action.tone]}`}><Send size={14} /></span>
                    <div className={styles.actionInfo}>
                      <strong>{action.label}</strong>
                      <small>{action.description}</small>
                      {result && <em className={styles.actionResult}>{result}</em>}
                    </div>
                    <div className={styles.actionSide}>
                      <span className={`${styles.actionCount} ${action.tone === "crit" && count ? styles.countCrit : ""}`}>
                        {count === undefined ? "—" : count.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        className={styles.runBtn}
                        disabled={running !== null || count === undefined || count === 0}
                        onClick={() => handleRun(action)}
                      >
                        {running === action.key ? "실행 중…" : "발송"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.railHead}>
              <span className={styles.railLabel}>빠른 업무</span>
            </div>
            <div className={styles.quickLinks}>
              {QUICK_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} className={styles.quickLink}>
                    <span><Icon size={18} /></span>
                    <div><strong>{item.label}</strong><small>{item.description}</small></div>
                    <ArrowUpRight size={17} />
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </AdminLayout>
  );
}
