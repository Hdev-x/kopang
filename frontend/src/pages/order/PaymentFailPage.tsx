import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Button } from "../../components/Button";
import styles from "./PaymentResultPage.module.css";

export function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code = searchParams.get("code") ?? "UNKNOWN_ERROR";
  const message =
    searchParams.get("message") ?? "결제 진행 중 알 수 없는 오류가 발생했습니다.";

  const handleRetry = () => {
    // sessionStorage에 저장된 PENDING 주문이 있으면 해당 주문으로 재결제
    const savedOrderId = sessionStorage.getItem("checkout_pending_order_id");
    if (savedOrderId) {
      navigate(`/checkout/resume/${savedOrderId}`, { replace: true });
    } else {
      navigate("/cart", { replace: true });
    }
  };

  const handleGoCart = () => {
    // 장바구니로 돌아가면 세션 주문 ID 초기화 (다음 주문 시 새 주문 생성)
    sessionStorage.removeItem("checkout_pending_order_id");
    navigate("/cart");
  };

  return (
    <Layout>
      <div className={styles.page}>
        {/* 아이콘 */}
        <div className={`${styles.iconWrap} ${styles.fail}`}>
          <XCircle size={40} strokeWidth={1.8} style={{ color: "var(--color-danger)" }} />
        </div>

        {/* 제목 */}
        <h1 className={styles.title}>결제에 실패했어요</h1>

        {/* 에러 메시지 */}
        <p className={styles.sub}>{message}</p>

        {/* 에러 코드 뱃지 */}
        <span className={styles.errorBadge}>에러 코드: {code}</span>

        {/* 버튼 */}
        <div className={styles.actions}>
          <Button className={styles.btnPrimary} onClick={handleRetry}>
            다시 결제하기
          </Button>
          <Button variant="ghost" className={styles.btnGhost} onClick={handleGoCart}>
            장바구니로 돌아가기
          </Button>
        </div>
      </div>
    </Layout>
  );
}
