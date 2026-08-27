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
import { Skeleton } from "../../components/Skeleton";
import { getSalesStats, type SalesStats } from "../../api/adminSales";
import {
  getChurnSummary,
  getInterventionPreview,
  measureOutcomes,
  recordChurnMetrics,
  resetDailyBatch,
  runChurnDetect,
  runCouponExpiringIntervention,
  runIntervention,
  runLoginInactiveIntervention,
  runMlScoring,
  type ChurnSummary,
  type InterventionPreview,
} from "../../api/churn";
import { getAdminOrders, type Order } from "../../api/order";
import { getPurchaseStats, type PurchaseStats } from "../../api/adminPurchaseStats";
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
      return `발송 ${r.sentCount}건 · 대조군 ${r.controlCount}건 (대상 ${r.targetCount}명)`;
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
  const [purchase, setPurchase] = useState<PurchaseStats | null>(null);
  const [preview, setPreview] = useState<InterventionPreview | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  // 배치·원복 진행 — 뼈대를 미리 깔아두고 실행하면 왼쪽부터 채워진다.
  // 두 줄을 따로 두는 이유: 하나를 돌릴 때 다른 쪽 결과가 지워지면
  // "방금 배치가 뭘 했는지"를 원복 직전에 확인할 수 없다.
  type StepState = "pending" | "running" | "done" | "failed";
  const [batchSteps, setBatchSteps] = useState<Record<string, { state: StepState; result?: string }>>({});
  const [resetSteps, setResetSteps] = useState<Record<string, { state: StepState; result?: string }>>({});

  const loadPreview = useCallback(() => {
    getInterventionPreview().then(setPreview).catch((e) => console.error("발송 대상 현황 로드 실패", e));
  }, []);

  useEffect(() => {
    getSalesStats().then(setSales).catch((e) => console.error("매출 통계 로드 실패", e));
    getChurnSummary().then(setChurn).catch((e) => console.error("이탈 요약 로드 실패", e));
    getAdminOrders().then((list) => setOrders(list.slice(0, 10))).catch((e) => console.error("최근 주문 로드 실패", e));
    getPurchaseStats().then(setPurchase).catch((e) => console.error("구매 분석 로드 실패", e));
    loadPreview();
  }, [loadPreview]);

  /*
   * 일 배치 — 스케줄러(매일 03:00)가 하는 일을 화면에서 그대로 실행한다.
   *
   * 한 번에 호출하지 않고 단계별로 부르는 이유: 전체가 몇 분 걸려서 "실행 중…"만
   * 떠 있으면 멈춘 건지 도는 건지 알 수 없다. 단계를 나누면 진행이 실제 값이 된다
   * (가짜 진행률이 아니라 각 단계가 끝날 때마다 표시가 바뀐다).
   */
  const BATCH_STEPS: { key: string; label: string; detail: string; run: () => Promise<string> }[] = [
    {
      key: "detect", label: "위험 감지", detail: "룰 8종으로 전 회원 판정",
      run: async () => { await runChurnDetect(); return "완료"; },
    },
    {
      key: "ml", label: "ML 스코어링", detail: "이탈 확률 예측 (서빙 :8000)",
      run: async () => {
        try { const r = await runMlScoring(); return `${(r?.scored ?? 0).toLocaleString()}명`; }
        catch { return "건너뜀 (서빙 불가)"; }   // ML 없이도 나머지는 진행돼야 한다
      },
    },
    {
      key: "send", label: "대응 발송", detail: "대조군 분리 후 처치군에만",
      run: async () => {
        // 세 경로를 모두 실행하는데 첫 응답만 쓰면 나머지 발송량이 빠진다.
        // 쿠폰만료·미로그인 전용 API 는 건수를 돌려주지 않으므로,
        // 실행 전후의 대상 현황 차이로 실제로 나간 양을 센다.
        const before = await getInterventionPreview();
        const r = await runIntervention();
        await runCouponExpiringIntervention();
        await runLoginInactiveIntervention();
        const after = await getInterventionPreview();
        const extra =
          (before.couponExpiringCount - after.couponExpiringCount) +
          (before.loginInactiveCount - after.loginInactiveCount);
        return `발송 ${(r.sentCount + Math.max(extra, 0)).toLocaleString()} · 대조군 ${r.controlCount.toLocaleString()}`;
      },
    },
    {
      key: "measure", label: "효과 측정", detail: "7일 창 전환 판정",
      run: async () => { const r = await measureOutcomes(); return `${(r?.measured ?? 0).toLocaleString()}건 확정`; },
    },
    {
      key: "metric", label: "지표 적재", detail: "일별 KPI 재집계",
      run: async () => { await recordChurnMetrics(); return "완료"; },
    },
  ];

  // 원복은 백엔드 한 번의 트랜잭션이라 중간 진행을 알 수 없다.
  // 도트는 "무엇을 되돌리는지" 보여주는 용도이고, 완료 시 각자의 건수가 채워진다.
  const RESET_STEPS = [
    { key: "coupons", label: "쿠폰 회수" },
    { key: "notifications", label: "알림 삭제" },
    { key: "outcomes", label: "측정 삭제" },
    { key: "interventions", label: "대응 삭제" },
  ];

  const handleBatch = async () => {
    if (!window.confirm("일 배치를 실행할까요?\n감지 → ML → 대응 발송 → 효과 측정 → 지표 적재 순으로 실행됩니다.\n알림·쿠폰이 실제로 발급됩니다.")) return;
    setRunning("__batch");
    setBatchSteps({});
    for (const step of BATCH_STEPS) {
      setBatchSteps((prev) => ({ ...prev, [step.key]: { state: "running" } }));
      try {
        const msg = await step.run();
        setBatchSteps((prev) => ({ ...prev, [step.key]: { state: "done", result: msg } }));
      } catch (e) {
        console.error(`${step.label} 실패`, e);
        setBatchSteps((prev) => ({ ...prev, [step.key]: { state: "failed", result: "실패" } }));
        break;   // 앞 단계가 실패하면 뒤는 의미가 없다 (발송은 감지 결과를 쓴다)
      }
    }
    loadPreview();
    setRunning(null);
  };

  // 오늘 실행분 원복 — 발송 상한(1일 1건·7일 중복) 때문에 재실행하려면 되돌려야 한다.
  // 팀원 여럿이 각자 눌러보려면 이 경로가 필요하다.
  const handleReset = async () => {
    if (!window.confirm("오늘 실행분을 원상 복구할까요?\n오늘 배치가 만든 대응·측정·알림·발급 쿠폰이 삭제되고 쿠폰 재고가 복구됩니다.\n(시연용 생성 데이터는 보존됩니다)")) return;
    setRunning("__reset");
    setResetSteps(Object.fromEntries(RESET_STEPS.map((s) => [s.key, { state: "running" as StepState }])));
    try {
      const r = await resetDailyBatch();
      const counts: Record<string, number> = {
        coupons: r.coupons, notifications: r.notifications,
        outcomes: r.outcomes, interventions: r.interventions,
      };
      setResetSteps(Object.fromEntries(
        RESET_STEPS.map((s) => [s.key, { state: "done" as StepState, result: `${counts[s.key].toLocaleString()}건` }])));
    } catch (e) {
      console.error("원상 복구 실패", e);
      setResetSteps(Object.fromEntries(RESET_STEPS.map((s) => [s.key, { state: "failed" as StepState, result: "실패" }])));
    }
    loadPreview();
    setRunning(null);
  };

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

  // 다섯 조회가 모두 끝나야 화면을 채운다. 응답 순서대로 하나씩 채우면
  // 값이 제각각 나타나 어수선하고, 그때마다 칸 크기가 바뀌어 화면이 움직인다.
  const ready = Boolean(sales && churn && orders && purchase && preview);

  const weekly = sales?.weeklySales ?? [];
  const weekMax = Math.max(...weekly.map((w) => w.amount), 1);
  const weekTotal = weekly.reduce((a, w) => a + w.amount, 0);

  // 오늘 매출 전일 대비 증감률 — 주간 추이의 마지막 두 점으로 계산
  let todayDelta: number | null = null;
  if (weekly.length >= 2) {
    const prev = weekly[weekly.length - 2].amount;
    if (prev > 0) todayDelta = ((weekly[weekly.length - 1].amount - prev) / prev) * 100;
  }

  // 상단 KPI 4개 — 이탈 고위험은 도넛·액션센터에서 표시
  const stats = [
    {
      label: "오늘 매출",
      value: ready && sales ? `${fmtShort(sales.todaySales)}원` : null,
      icon: CircleDollarSign,
      color: "#2f6bff",
      sub: !ready || todayDelta === null ? null : `${todayDelta >= 0 ? "▲" : "▼"} 전일 대비 ${Math.abs(todayDelta).toFixed(1)}%`,
      subTone: todayDelta !== null && todayDelta >= 0 ? "up" : "down",
    },
    { label: "이번 달 매출", value: ready && sales ? `${fmtShort(sales.monthSales)}원` : null, icon: Wallet, color: "#2f6bff", sub: null, subTone: "" },
    { label: "총 매출", value: ready && sales ? `${fmtShort(sales.totalSales)}원` : null, icon: Sigma, color: "#2f6bff", sub: ready ? "누적 결제 완료" : null, subTone: "" },
    {
      label: "오늘 주문",
      value: ready && sales ? `${sales.todayOrders.toLocaleString()}건` : null,
      icon: ClipboardList,
      color: "#12a150",
      sub: ready && sales ? `신규 회원 ${sales.newMembers.toLocaleString()}명` : null,
      subTone: "",
    },
  ];

  // 이탈 위험 분포 → 도넛(conic-gradient) 구간 계산
  const dist = churn?.levelCounts ?? [];
  const distTotal = dist.reduce((a, d) => a + d.count, 0) || 1;
  const counts = { HIGH: 0, MID: 0, LOW: 0, ...Object.fromEntries(dist.map((d) => [d.riskLevel, d.count])) } as Record<string, number>;
  const highPct = (counts.HIGH / distTotal) * 100;
  const midEnd = highPct + (counts.MID / distTotal) * 100;
  const donutBg = !ready
    ? "conic-gradient(#eef1f5 0 100%)"
    : `conic-gradient(${RISK_META.HIGH.color} 0 ${highPct}%, ${RISK_META.MID.color} ${highPct}% ${midEnd}%, ${RISK_META.LOW.color} ${midEnd}% 100%)`;

  const actionTotal = preview ? preview.integratedCount + preview.couponExpiringCount + preview.loginInactiveCount : null;

  // 감지 배치 시각 — 액션센터 카운트가 "오늘 감지분" 기준임을 판단할 근거
  const lastRun = churn?.lastRuleRunAt;
  const batchLabel = lastRun ? `${lastRun.slice(5, 10).replace("-", "/")} ${lastRun.slice(11, 16)}` : "미실행";

  return (
    <AdminLayout title="통합 대시보드" fullBleed>
      <div className={styles.page}>
        <div className={styles.railGrid}>
          <div className={styles.mainCol}>
        <div className={styles.pageHead}>
          <p className={styles.caption}>오늘 상태와 처리할 일을 한눈에</p>
          <span className={styles.basis}>
            <i />매출·주문 실시간 · 이탈 지표: 현재 상태 기준 (임시) · 감지 배치 {batchLabel}
          </span>
        </div>
        <div className={`${styles.fRow} ${styles.fKpis}`}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={styles.fCell}>
                <span className={styles.kTop}><Icon size={14} className={styles.kIcon} color={stat.color} /><span className={styles.label}>{stat.label}</span></span>
                <b className={styles.kValue}>
                  {stat.value === null ? <Skeleton w={96} h={22} /> : stat.value}
                </b>
                {/* 보조 문구는 데이터가 와야 생긴다. 없을 때도 같은 높이의 빈 줄을 둬야
                    칸 높이가 변하지 않고 아래 구분선이 제자리에 있다. */}
                <span className={`${styles.kSub} ${stat.subTone === "up" ? styles.up : stat.subTone === "down" ? styles.down : ""}`}>
                  {stat.sub ?? " "}
                </span>
              </div>
            );
          })}
        </div>
          <div className={styles.subRow}>
          <div className={styles.sec}>
            <div className={styles.secHead}>
              <h2>주간 매출 추이</h2>
              <p>최근 7일 결제 완료 · 합계 {!ready
                ? <Skeleton w={54} h={12} style={{ display: "inline-block", verticalAlign: "-1px" }} />
                : <span className={styles.total}>{fmtShort(weekTotal)}</span>}</p>
            </div>
            <div className={styles.chart}>
              {!ready || weekly.length === 0 ? (
                /* 축·높이는 그대로 두고 막대만 비운다 — 값이 오면 그 자리에서 자란다 */
                Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className={styles.bar}>
                    <span className={styles.barAmount}><Skeleton w={30} h={10} /></span>
                    <div className={styles.barTrack} />
                    <span className={styles.barLabel}><Skeleton w={26} h={9} /></span>
                  </div>
                ))
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
          </div>

          <div className={styles.sec}>
            <div className={styles.secHead}>
              <h2>이탈 위험 분포</h2>
              <p>대상 {!ready ? <Skeleton w={34} h={12} style={{ display: "inline-block", verticalAlign: "-1px" }} /> : distTotal.toLocaleString()}명 · <Link to="/admin/churn" className={styles.textLink}>상세 <ChevronRight size={13} /></Link></p>
            </div>
            <div className={styles.donutWrap}>
              <div className={styles.donut} style={{ background: donutBg }}>
                <div className={styles.donutHole}>
                  <b>{!ready ? <Skeleton w={30} h={16} /> : counts.HIGH.toLocaleString()}</b>
                  <span>고위험</span>
                </div>
              </div>
              <ul className={styles.legend}>
                {(["HIGH", "MID", "LOW"] as const).map((lv) => (
                  <li key={lv}>
                    <i style={{ background: RISK_META[lv].color }} />
                    {RISK_META[lv].label}
                    <b>{!ready ? <Skeleton w={26} h={12} /> : (counts[lv] ?? 0).toLocaleString()}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </div>

          <div className={styles.subRow2}>
          <div className={styles.sec}>
            <div className={styles.secHead}>
              <h2>최근 주문</h2>
              <p><Link to="/admin/orders" className={styles.textLink}>전체 주문 <ChevronRight size={13} /></Link></p>
            </div>
            <div className={styles.orderTable}>
              <div className={styles.orderHeader}><span>주문번호</span><span>주문자</span><span>결제금액</span><span>상태</span></div>
              {/* 헤더는 표 바깥에 두고 본문만 스크롤시킨다 — 열 이름이 항상 보인다 */}
              <div className={styles.orderBody}>
                {!ready || orders === null ? (
                  <p className={styles.caption}>데이터를 불러오는 중…</p>
                ) : orders.length === 0 ? (
                  <p className={styles.caption}>최근 주문이 없습니다.</p>
                ) : (
                  orders.map((o) => {
                    const meta = orderStatusMeta(o);
                    return (
                      <div key={o.orderId} className={`${styles.orderRow}`}>
                        <strong>C{String(o.orderId).padStart(5, "0")}</strong>
                        <span>{o.userName ?? `회원 ${o.userId}`}</span>
                        <span>{o.totalPrice.toLocaleString()}원</span>
                        <span className={`${styles.status} ${styles[meta.tone]}`}>{meta.label}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className={styles.sec}>
            <div className={styles.secHead}>
              <h2>인기 상품 Top 10</h2>
              <p>판매량 기준 · <Link to="/admin/stats" className={styles.textLink}>구매 분석 <ChevronRight size={13} /></Link></p>
            </div>
            <div className={styles.orderTable}>
              <div className={`${styles.orderHeader} ${styles.topGrid}`}><span>상품</span><span>판매량</span><span>재구매율</span></div>
              <div className={styles.orderBody}>
                {!ready || purchase === null ? (
                  <p className={styles.caption}>데이터를 불러오는 중…</p>
                ) : (
                  purchase.topProducts.slice(0, 10).map((tp, i) => (
                    <div key={tp.productId} className={`${styles.orderRow} ${styles.topGrid}`}>
                      <strong className={styles.topName}>{i + 1}. {tp.name}</strong>
                      <span>{tp.quantity.toLocaleString()}개</span>
                      <span>{tp.repeatPurchaseRate}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          </div>
          </div>

          <div className={styles.railCol}>
          <div className={styles.sec}>
            <div className={styles.secHead}>
              <h2>오늘 처리할 일</h2>
              <p>
                {actionTotal !== null && actionTotal > 0 && <span className={styles.critChip}>{actionTotal.toLocaleString()}</span>}
                {" "}
                <Link to="/admin/churn/interventions" className={styles.textLink}>대응 이력 <ChevronRight size={13} /></Link>
              </p>
            </div>
            {/* 일 배치 — 스케줄러(매일 03:00)와 같은 일을 화면에서 실행. 개별 발송은 아래에 유지.
                도트 라인을 미리 깔아두고 실행하면 왼쪽부터 채워진다. */}
            <div className={styles.batchBox}>
              <div className={styles.batchRow}>
                <div className={styles.batchHead}>
                  <strong>일 배치</strong>
                  <button type="button" className={styles.batchRun} disabled={running !== null} onClick={handleBatch}>
                    {running === "__batch" ? "실행 중" : "배치 실행"}
                  </button>
                </div>
                <ol className={styles.dots}>
                  {BATCH_STEPS.map((s) => {
                    const st = batchSteps[s.key]?.state ?? "pending";
                    return (
                      <li key={s.key} className={`${styles.dot} ${styles["st_" + st]}`}>
                        <span className={styles.dotMark}>{st === "done" ? "✓" : st === "failed" ? "!" : ""}</span>
                        <span className={styles.dotLabel}>{s.label}</span>
                        <span className={styles.dotResult}>{batchSteps[s.key]?.result ?? ""}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className={`${styles.batchRow} ${styles.batchRowSub}`}>
                <div className={styles.batchHead}>
                  <strong>원상 복구</strong>
                  <button type="button" className={styles.batchReset} disabled={running !== null} onClick={handleReset}>
                    {running === "__reset" ? "복구 중" : "원상 복구"}
                  </button>
                </div>
                <ol className={styles.dots}>
                  {RESET_STEPS.map((s) => {
                    const st = resetSteps[s.key]?.state ?? "pending";
                    return (
                      <li key={s.key} className={`${styles.dot} ${styles["st_" + st]}`}>
                        <span className={styles.dotMark}>{st === "done" ? "✓" : st === "failed" ? "!" : ""}</span>
                        <span className={styles.dotLabel}>{s.label}</span>
                        <span className={styles.dotResult}>{resetSteps[s.key]?.result ?? ""}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
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
                        {!ready || count === undefined ? <Skeleton w={22} h={15} /> : count.toLocaleString()}
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
          </div>

          <div className={styles.sec}>
            <div className={styles.secHead}>
              <h2>빠른 업무</h2>
              <p>자주 쓰는 메뉴</p>
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
          </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
