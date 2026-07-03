import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AdminLayout } from "../../components/AdminLayout";
import { Card } from "../../components/Card";
import styles from "./AdminPage.module.css";

// 전부 목업 통계 (실제론 집계 쿼리)
const STATS = [
  { label: "오늘 매출", value: "₩4.82M", delta: "+12%" },
  { label: "주문 수", value: "1,284", delta: "+8%" },
  { label: "신규 회원", value: "76", delta: "+5%" },
  { label: "이탈 위험군", value: "143", delta: "주의", warn: true },
];
const SALES = [
  { d: "월", v: 60 }, { d: "화", v: 75 }, { d: "수", v: 50 },
  { d: "목", v: 90 }, { d: "금", v: 100 }, { d: "토", v: 82 }, { d: "일", v: 68 },
];
// ML 이탈 점수(churn_score) 기반 위험 등급 — 상세 대시보드 도넛과 동일 수치
const RISK = [
  { type: "고위험 (0.7↑)", count: 143, color: "var(--color-danger)" },
  { type: "중위험 (0.4~0.7)", count: 312, color: "var(--color-warning)" },
  { type: "저위험", count: 1945, color: "var(--color-success)" },
];
const ORDERS = [
  { no: "C00123", user: "홍길동", amt: "₩34,860", status: "결제완료" },
  { no: "C00124", user: "김철수", amt: "₩129,000", status: "배송중" },
  { no: "C00125", user: "이영희", amt: "₩12,500", status: "배송완료" },
];

export function AdminPage() {
  return (
    <AdminLayout title="관리자 대시보드">
      <div className={styles.stats}>
        {STATS.map((s) => (
          <Card key={s.label} className={styles.statCard}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>{s.value}</p>
            <span className={`${styles.delta} ${s.warn ? styles.warn : ""}`}>{s.delta}</span>
          </Card>
        ))}
      </div>

      <h2 className={styles.section}>주간 매출</h2>
      <Card>
        <div className={styles.chart}>
          {SALES.map((s) => (
            <div key={s.d} className={styles.bar}>
              <div className={styles.barFill} style={{ height: `${s.v}%` }} />
              <span className={styles.barLabel}>{s.d}</span>
            </div>
          ))}
        </div>
      </Card>

      <h2 className={styles.section}>AI 이탈 위험 등급</h2>
      <Card className={styles.riskCard}>
        {RISK.map((r) => (
          <div key={r.type} className={styles.riskRow}>
            <span>{r.type}</span>
            <strong style={{ color: r.color }}>{r.count}명</strong>
          </div>
        ))}
        <Link to="/admin/churn" className={styles.riskLink}>
          이탈 방지 대시보드 자세히 보기
          <ChevronRight size={16} />
        </Link>
      </Card>

      <h2 className={styles.section}>최근 주문</h2>
      <Card className={styles.riskCard}>
        {ORDERS.map((o) => (
          <div key={o.no} className={styles.riskRow}>
            <span>
              {o.no} · {o.user}
            </span>
            <span>
              {o.amt} <span className={styles.orderStatus}>{o.status}</span>
            </span>
          </div>
        ))}
      </Card>
    </AdminLayout>
  );
}
