import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Star } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Button } from "../../components/Button";
import { submitSatisfaction } from "../../api/satisfaction";
import styles from "./OrderCompletePage.module.css";

export function OrderCompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const orderNo = `ORD-${orderId}`;

  // 만족도 위젯 상태 (CHURN-17)
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!score) return;
    // 낙관적: UI 먼저 감사 표시, 응답률 낮은 수집이라 실패는 조용히 무시
    setSubmitted(true);
    submitSatisfaction(score, "ORDER").catch(() => {});
  };

  return (
    <Layout>
      <div className={styles.wrap}>
        <CheckCircle2 size={64} className={styles.icon} strokeWidth={1.8} />
        <h1 className={styles.title}>주문이 완료되었어요</h1>
        <p className={styles.orderNo}>주문번호 {orderNo}</p>

        {/* 만족도 수집 (CHURN-17) */}
        <div className={styles.survey}>
          {submitted ? (
            <p className={styles.surveyThanks}>소중한 의견 감사합니다 🙏</p>
          ) : (
            <>
              <p className={styles.surveyLabel}>이번 주문은 어떠셨나요?</p>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={styles.starBtn}
                    aria-label={`${n}점`}
                    onClick={() => setScore(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <Star
                      size={28}
                      strokeWidth={1.8}
                      fill={(hover || score) >= n ? "var(--color-warning)" : "none"}
                      color={(hover || score) >= n ? "var(--color-warning)" : "var(--color-border)"}
                    />
                  </button>
                ))}
              </div>
              <Button className={styles.surveyBtn} disabled={!score} onClick={submit}>
                평가 남기기
              </Button>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" className={styles.btn} onClick={() => navigate("/")}>
            홈으로
          </Button>
          <Button className={styles.btn} onClick={() => navigate("/my/orders")}>
            주문내역 보기
          </Button>
        </div>
      </div>
    </Layout>
  );
}
