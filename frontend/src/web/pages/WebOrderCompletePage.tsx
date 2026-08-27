import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Star } from "lucide-react";
import { submitSatisfaction, getSatisfactionEligibility, SATISFACTION_REASONS } from "../../api/satisfaction";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebOrderCompletePage.module.css";

export function WebOrderCompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const orderNo = `ORD-${orderId}`;

  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [reason, setReason] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [eligible, setEligible] = useState<boolean | null>(null);

  useEffect(() => {
    getSatisfactionEligibility()
      .then(setEligible)
      .catch(() => setEligible(false));
  }, []);

  const submit = () => {
    if (!score) return;
    setSubmitted(true);
    submitSatisfaction(score, "ORDER", reason ?? undefined).catch(() => {});
  };

  return (
    <WebLayout>
      <div className={styles.container}>
        <div className={styles.card}>
          <CheckCircle2 size={64} className={styles.icon} strokeWidth={1.8} />
          <h1 className={styles.title}>주문이 완료되었습니다</h1>
          <p className={styles.orderNo}>주문번호 {orderNo}</p>
          <p className={styles.desc}>
            주문하신 상품은 확인 후 빠르게 배송해 드리겠습니다.
          </p>

          {eligible && (
            <div className={styles.survey}>
              {submitted ? (
                <p className={styles.surveyThanks}>소중한 의견 감사합니다 🙏</p>
              ) : (
                <>
                  <p className={styles.surveyLabel}>이번 주문 과정은 어떠셨나요?</p>
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
                          fill={(hover || score) >= n ? "#ffc107" : "none"}
                          color={(hover || score) >= n ? "#ffc107" : "#ddd"}
                        />
                      </button>
                    ))}
                  </div>
                  {score > 0 && (
                    <div className={styles.reasonRow}>
                      {SATISFACTION_REASONS.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          className={`${styles.reasonChip} ${reason === r.value ? styles.reasonChipOn : ""}`}
                          onClick={() => setReason(reason === r.value ? null : r.value)}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.surveyBtn}
                    disabled={!score}
                    onClick={submit}
                  >
                    평가 남기기
                  </button>
                </>
              )}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.homeBtn}
              onClick={() => navigate("/web")}
            >
              쇼핑 홈으로
            </button>
            <button
              type="button"
              className={styles.ordersBtn}
              onClick={() => navigate(orderId ? `/web/my/orders/${orderId}` : "/web/my/orders")}
            >
              주문 상세 보기
            </button>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
