import { useEffect, useRef, useState } from "react";
import { Check, Crown } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { cancelMembership, getMembershipStatus, getSavedShippingFee, keepMembership, recordMembershipCancelModal, subscribeMembership, type UserMembershipResponse } from "../../api/membership";
import { useAuth } from "../../hooks/useAuth";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebMembershipPages.module.css";

const BENEFITS = ["무료배송 무제한", "구매액 최대 5% 적립", "회원 전용 특가·쿠폰", "무료 반품 혜택"];
const CLIENT_KEY = "test_ck_nRQoOaPz8LNMgv7d5bDPVy47BMw6";

export function WebMembershipPage() {
  const user = useAuth();
  const navigate = useNavigate();
  const [membership, setMembership] = useState<UserMembershipResponse>(null);
  const [savedFee, setSavedFee] = useState(0);
  const [loading, setLoading] = useState(Boolean(user));
  const [modalOpen, setModalOpen] = useState(false);

  const reload = () => Promise.all([getMembershipStatus(), getSavedShippingFee()]).then(([status, fee]) => { setMembership(status); setSavedFee(fee.savedFee); });
  useEffect(() => { if (user) reload().catch(() => undefined).finally(() => setLoading(false)); }, [user]);

  const subscribe = async () => {
    try {
      const toss = (window as unknown as { TossPayments: (key: string) => { requestPayment: (method: string, options: Record<string, unknown>) => Promise<void> } }).TossPayments(CLIENT_KEY);
      await toss.requestPayment("카드", { amount: 4990, orderId: `MEMBERSHIP-${Date.now()}`, orderName: "Kopang 멤버십 정기 구독", successUrl: `${window.location.origin}/web/membership/success`, failUrl: `${window.location.origin}/web/membership/fail` });
    } catch { window.alert("결제를 시작하지 못했어요."); }
  };

  // 대조군에게는 만류 모달을 띄우지 않는다.
  // 응답의 isControl 을 버리고 무조건 띄우면 "대응받지 않은 군"이 성립하지 않아
  // 효과 리포트의 MODAL 순효과가 무의미해진다(대조군도 모달을 본 상태의 비교).
  const handleOpenCancelModal = async () => {
    try {
      const res = await recordMembershipCancelModal();
      if (res?.isControl) {
        await handleConfirmCancel();   // 대조군: 만류 없이 바로 해지 진행
        return;
      }
    } catch (err) {
      console.error(err);   // 기록 실패 시에도 사용자 흐름은 막지 않는다
    }
    setModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelMembership();
      setModalOpen(false);
      reload();
    } catch {
      window.alert("해지 예약에 실패했어요.");
    }
  };

  if (!user) return <WebLayout><div className={styles.center}><Crown size={42} /><h1>로그인이 필요한 혜택이에요.</h1><Link to="/web/login">로그인하기</Link></div></WebLayout>;
  if (loading) return <WebLayout><div className={styles.center}>멤버십 정보를 불러오는 중이에요.</div></WebLayout>;
  const active = membership?.status === "ACTIVE";
  const cancelled = membership?.status === "CANCELLED";

  return (
    <WebLayout>
      <section className={styles.hero}>
        <Crown size={32} />
        <p>KOPANG MEMBERSHIP</p>
        <h1>매달 누리는 쇼핑 혜택</h1>
        <strong>월 4,990원</strong>
      </section>
      <div className={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <article key={benefit}>
            <Check size={20} />
            <span>{benefit}</span>
          </article>
        ))}
      </div>
      <section className={styles.statusCard}>
        <div>
          <p>현재 멤버십 상태</p>
          <h2>{active ? "이용 중" : cancelled ? "해지 예약" : "미가입"}</h2>
          {membership?.endDate && <span>혜택 만료일 {membership.endDate.slice(0, 10)}</span>}
        </div>
        <div>
          <p>이번 달 절약한 배송비</p>
          <strong>{savedFee.toLocaleString()}원</strong>
        </div>
      </section>
      <div className={styles.actions}>
        {active ? (
          <button type="button" className={styles.secondary} onClick={handleOpenCancelModal}>
            멤버십 해지 예약
          </button>
        ) : cancelled ? (
          <button type="button" onClick={() => keepMembership().then(reload).catch(() => window.alert("혜택 유지에 실패했어요."))}>
            멤버십 유지하기
          </button>
        ) : (
          <button type="button" onClick={subscribe}>
            멤버십 시작하기
          </button>
        )}
        <button type="button" className={styles.secondary} onClick={() => navigate("/web")}>
          쇼핑홈으로
        </button>
      </div>

      {/* 이탈 방지 멤버십 해지 만류 모달 (PC 웹) */}
      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>정말 KOPANG WOW 멤버십을 해지하시겠어요?</div>
            <div className={styles.modalBody}>
              이번 달 멤버십으로 아낀 배송비가 <span className={styles.highlightFee}>{savedFee.toLocaleString()}원</span>이에요.<br />
              지금 해지하시면 다음 달부터 모든 무료배송 및 회원 전용 적립 혜택이 만료돼요.
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.keepBtn} onClick={() => setModalOpen(false)}>
                혜택 유지하기
              </button>
              <button type="button" className={styles.confirmCancelBtn} onClick={handleConfirmCancel}>
                그래도 해지하기
              </button>
            </div>
          </div>
        </div>
      )}
    </WebLayout>
  );
}

export function WebMembershipSuccessPage() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const ran = useRef(false); const [message, setMessage] = useState("멤버십 가입을 처리하고 있어요.");
  useEffect(() => { if (ran.current) return; ran.current = true; const paymentKey = params.get("paymentKey") ?? ""; const orderId = params.get("orderId") ?? ""; const amount = Number(params.get("amount") || 0); if (!paymentKey || !orderId || !amount) { navigate("/web/membership/fail?code=INVALID_PARAMS", { replace: true }); return; } subscribeMembership({ paymentKey, orderId, amount }).then(() => { setMessage("멤버십 가입이 완료됐어요."); window.setTimeout(() => navigate("/web/membership", { replace: true }), 1500); }).catch(() => setMessage("가입 승인에 실패했어요. 고객센터에 문의해 주세요.")); }, [params, navigate]);
  return <WebLayout><div className={styles.center}><div className={styles.spinner} /><h1>{message}</h1></div></WebLayout>;
}

export function WebMembershipFailPage() { const [params] = useSearchParams(); return <WebLayout><div className={styles.center}><Crown size={42} /><h1>멤버십 결제를 완료하지 못했어요.</h1><p>{params.get("message") ?? params.get("code") ?? "결제 정보를 다시 확인해 주세요."}</p><Link to="/web/membership">멤버십으로 돌아가기</Link></div></WebLayout>; }
