import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Button } from "../../components/Button";
import styles from "./OrderCompletePage.module.css";

export function OrderCompletePage() {
  const navigate = useNavigate();
  // 목업 주문번호 (한 번만 생성)
  const [orderNo] = useState(() => `C${Date.now().toString().slice(-10)}`);

  return (
    <Layout>
      <div className={styles.wrap}>
        <CheckCircle2 size={64} className={styles.icon} strokeWidth={1.8} />
        <h1 className={styles.title}>주문이 완료되었어요</h1>
        <p className={styles.orderNo}>주문번호 {orderNo}</p>
        <div className={styles.actions}>
          <Button variant="ghost" className={styles.btn} onClick={() => navigate("/")}>
            홈으로
          </Button>
          <Button className={styles.btn} onClick={() => navigate("/my")}>
            주문내역 보기
          </Button>
        </div>
      </div>
    </Layout>
  );
}
