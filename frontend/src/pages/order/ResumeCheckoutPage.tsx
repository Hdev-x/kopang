import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { getOrderDetails } from "../../api/order";
import type { Order } from "../../api/order";
import styles from "./CheckoutPage.module.css";

const CLIENT_KEY = "test_ck_nRQoOaPz8LNMgv7d5bDPVy47BMw6";

export function ResumeCheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getOrderDetails(Number(orderId))
      .then((data) => {
        if (!data || data.paymentStatus !== "PENDING") {
          alert("결제 대기 중인 주문이 아닙니다.");
          navigate(-1);
          return;
        }
        setOrder(data);
      })
      .catch(() => {
        alert("주문 정보를 불러오지 못했습니다.");
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  const handlePayNow = async () => {
    if (!order) return;
    try {
      const tossPayments = (
        window as unknown as {
          TossPayments: (key: string) => {
            requestPayment: (
              method: string,
              opts: Record<string, unknown>
            ) => Promise<void>;
          };
        }
      ).TossPayments(CLIENT_KEY);

      const firstItem = order.items?.[0];
      const orderName =
        order.items && order.items.length > 1
          ? `${firstItem?.name ?? "상품"} 외 ${order.items.length - 1}건`
          : (firstItem?.name ?? "상품");

      await tossPayments.requestPayment("카드", {
        amount: order.totalPrice,
        orderId: `ORD-${order.orderId}`,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err: unknown) {
      console.error("결제 오류:", err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.page}>
          <PageHeader title="결제 진행하기" />
          <div className={styles.widgetLoading}>
            <span className={styles.widgetSpinner} />
            주문 정보를 불러오는 중...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.page}>
        <PageHeader title="결제 진행하기" />

        {order && (
          <>
            {/* 주문 상품 정보 */}
            <p className={styles.section}>주문 상품</p>
            <div className={styles.card}>
              {order.items?.map((item) => (
                <div key={item.orderItemId} className={styles.orderItem}>
                  <span className={styles.orderItemName}>{item.name}</span>
                  <span className={styles.orderItemQty}>{item.quantity}개</span>
                  <span className={styles.orderItemPrice}>
                    {(item.price * item.quantity).toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>

            {/* 금액 요약 + 결제 버튼 */}
            <div className={styles.summary}>
              <div className={styles.amountTotal}>
                <span className={styles.amountTotalLabel}>총 결제금액</span>
                <strong className={styles.amountTotalValue}>
                  {order.totalPrice.toLocaleString()}원
                </strong>
              </div>
              <Button className={styles.pay} onClick={handlePayNow}>
                {order.totalPrice.toLocaleString()}원 결제하기
              </Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
