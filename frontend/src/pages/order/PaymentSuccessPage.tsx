import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { client } from "../../api/client";
import { Layout } from "../../components/Layout";
import styles from "./PaymentResultPage.module.css";

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("결제를 승인하고 있습니다...");
  const didRun = useRef(false);

  const paymentKey = searchParams.get("paymentKey") ?? "";
  const orderId = searchParams.get("orderId") ?? "";
  const amount = Number(searchParams.get("amount") || "0");

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (!paymentKey || !orderId || !amount) {
      navigate(
        "/payment/fail?code=INVALID_PARAMS&message=" +
          encodeURIComponent("유효하지 않은 결제 정보입니다."),
        { replace: true }
      );
      return;
    }

    client
      .post("/orders/confirm", { paymentKey, orderId, amount })
      .then(() => {
        // 결제 완료 → 세션 주문 ID 정리
        sessionStorage.removeItem("checkout_pending_order_id");
        const idOnly = orderId.replace("ORD-", "");
        navigate(`/order/complete?orderId=${idOnly}`, { replace: true });
      })
      .catch((err: unknown) => {
        console.error("결제 승인 오류:", err);
        const errMsg =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "결제 승인에 실패했습니다.";
        setMessage(errMsg);
      });
  }, [paymentKey, orderId, amount, navigate]);

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>{message}</p>
      </div>
    </Layout>
  );
}
