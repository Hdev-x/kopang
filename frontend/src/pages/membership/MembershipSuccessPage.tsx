import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { subscribeMembership } from "../../api/membership";
import styles from "../order/PaymentResultPage.module.css";

export function MembershipSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("멤버십 결제를 승인하고 가입을 처리 중입니다...");
  const didRun = useRef(false);

  const paymentKey = searchParams.get("paymentKey") ?? "";
  const orderId = searchParams.get("orderId") ?? "";
  const amount = Number(searchParams.get("amount") || "0");

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (!paymentKey || !orderId || !amount) {
      navigate(
        "/membership/fail?code=INVALID_PARAMS&message=" +
          encodeURIComponent("유효하지 않은 결제 정보입니다."),
        { replace: true }
      );
      return;
    }

    // 결제 성공 시 실제 백엔드 멤버십 가입 API 호출
    subscribeMembership()
      .then(() => {
        setMessage("와우 멤버십 가입이 성공적으로 완료되었습니다! 잠시 후 멤버십 페이지로 이동합니다.");
        setTimeout(() => {
          navigate("/membership", { replace: true });
        }, 2000);
      })
      .catch((err: unknown) => {
        console.error("멤버십 가입 처리 오류:", err);
        const errMsg =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "멤버십 가입 승인에 실패했습니다.";
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
