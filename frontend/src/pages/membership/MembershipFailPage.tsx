import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { Button } from "../../components/Button";
import styles from "../order/PaymentResultPage.module.css";

export function MembershipFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code = searchParams.get("code") ?? "UNKNOWN_ERROR";
  const message = searchParams.get("message") ?? "결제 진행 중 오류가 발생했습니다.";

  return (
    <Layout>
      <div className={styles.page}>
        <div className={`${styles.iconWrap} ${styles.fail}`}>
          <span style={{ fontSize: "36px", color: "var(--color-danger)" }}>✕</span>
        </div>
        <h1 className={styles.title}>결제 실패</h1>
        <div className={styles.errorBadge}>{code}</div>
        <p className={styles.sub}>{message}</p>
        <div className={styles.actions}>
          <Button className={styles.btnPrimary} onClick={() => navigate("/membership", { replace: true })}>
            멤버십 페이지로 돌아가기
          </Button>
        </div>
      </div>
    </Layout>
  );
}
