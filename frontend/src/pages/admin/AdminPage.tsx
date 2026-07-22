import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { AdminLayout } from "../../components/AdminLayout";
import styles from "./AdminPage.module.css";

// TODO: 대시보드 집계 API가 확정되면 실제 데이터로 교체한다.
const STATS = [
  { label: "오늘 매출", value: "4,820,000원", delta: "전일 대비 12.4%", icon: CircleDollarSign, tone: "blue" },
  { label: "오늘 주문", value: "1,284건", delta: "전일 대비 8.1%", icon: ClipboardList, tone: "green" },
  { label: "신규 회원", value: "76명", delta: "전일 대비 5.2%", icon: UserPlus, tone: "violet" },
  { label: "이탈 고위험군", value: "143명", delta: "즉시 확인 필요", icon: AlertTriangle, tone: "red" },
];

const SALES = [
  { d: "월", v: 60, amount: "3.1M" },
  { d: "화", v: 75, amount: "3.8M" },
  { d: "수", v: 50, amount: "2.6M" },
  { d: "목", v: 90, amount: "4.5M" },
  { d: "금", v: 100, amount: "5.1M" },
  { d: "토", v: 82, amount: "4.2M" },
  { d: "일", v: 68, amount: "3.5M" },
];

const RISK = [
  { type: "고위험", range: "0.7 이상", count: 143, rate: 6, color: "#ff5b5b" },
  { type: "중위험", range: "0.4 ~ 0.7", count: 312, rate: 13, color: "#ffb545" },
  { type: "저위험", range: "0.4 미만", count: 1945, rate: 81, color: "#29b879" },
];

const ORDERS = [
  { no: "C00123", user: "홍길동", amt: "34,860원", status: "결제완료", tone: "ready" },
  { no: "C00124", user: "김철수", amt: "129,000원", status: "배송중", tone: "shipping" },
  { no: "C00125", user: "이영희", amt: "12,500원", status: "배송완료", tone: "done" },
  { no: "C00126", user: "박민준", amt: "81,200원", status: "상품준비", tone: "ready" },
];

const QUICK_LINKS = [
  { to: "/admin/products", label: "상품 등록·관리", description: "판매 상품과 재고를 관리합니다.", icon: Boxes },
  { to: "/admin/orders", label: "주문·배송 처리", description: "신규 주문과 배송 상태를 확인합니다.", icon: ClipboardList },
  { to: "/admin/members", label: "회원 관리", description: "회원 정보와 활동 상태를 조회합니다.", icon: UsersRound },
];

export function AdminPage() {
  return (
    <AdminLayout title="통합 대시보드">
      <div className={styles.notice}>
        <span>DEMO</span>
        현재 대시보드 요약 수치는 화면 설계용 데이터입니다. 각 관리 메뉴의 실제 API 기능은 그대로 사용할 수 있습니다.
      </div>

      <section className={styles.stats} aria-label="오늘의 운영 현황">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles[stat.tone]}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className={styles.statLabel}>{stat.label}</p>
                <strong className={styles.statValue}>{stat.value}</strong>
                <p className={`${styles.delta} ${stat.tone === "red" ? styles.warn : ""}`}>
                  {stat.delta}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <div className={styles.dashboardGrid}>
        <section className={`${styles.panel} ${styles.salesPanel}`}>
          <div className={styles.panelHead}>
            <div>
              <h2>주간 매출 추이</h2>
              <p>최근 7일 결제 완료 기준</p>
            </div>
            <strong className={styles.total}>26.8M</strong>
          </div>
          <div className={styles.chart}>
            {SALES.map((sale) => (
              <div key={sale.d} className={styles.bar}>
                <span className={styles.barAmount}>{sale.amount}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ height: `${sale.v}%` }} />
                </div>
                <span className={styles.barLabel}>{sale.d}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>AI 이탈 위험 분포</h2>
              <p>전체 분석 대상 2,400명</p>
            </div>
            <Link to="/admin/churn" className={styles.textLink}>상세보기 <ChevronRight size={15} /></Link>
          </div>
          <div className={styles.riskList}>
            {RISK.map((risk) => (
              <div key={risk.type} className={styles.riskItem}>
                <div className={styles.riskMeta}>
                  <span><i style={{ background: risk.color }} />{risk.type} <small>{risk.range}</small></span>
                  <strong>{risk.count.toLocaleString()}명</strong>
                </div>
                <div className={styles.riskTrack}>
                  <span style={{ width: `${risk.rate}%`, background: risk.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.bottomGrid}>
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
            {ORDERS.map((order) => (
              <div key={order.no} className={styles.orderRow}>
                <strong>{order.no}</strong>
                <span>{order.user}</span>
                <span>{order.amt}</span>
                <span className={`${styles.status} ${styles[order.tone]}`}>{order.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>빠른 업무</h2>
              <p>자주 사용하는 관리 메뉴</p>
            </div>
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
      </div>
    </AdminLayout>
  );
}
