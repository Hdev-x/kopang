import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { useAuth } from "../../hooks/useAuth";
import {
  getMembershipStatus,
  subscribeMembership,
  cancelMembership,
  keepMembership,
  getSavedShippingFee,
  type UserMembershipResponse
} from "../../api/membership";
import styles from "./MembershipPage.module.css";

const BENEFITS = ["무료배송 무제한", "구매액 5% 적립", "회원 단독 특가·쿠폰", "무료 반품"];
const CLIENT_KEY = "test_ck_nRQoOaPz8LNMgv7d5bDPVy47BMw6";

export function MembershipPage() {
  const user = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<UserMembershipResponse>(null);
  const [savedFee, setSavedFee] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // 데이터 로드 (마운트 시 자동 기동)
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    Promise.all([getMembershipStatus(), getSavedShippingFee()])
      .then(([statusData, feeData]) => {
        setMembership(statusData);
        setSavedFee(feeData.savedFee);
      })
      .catch((err) => {
        console.error("멤버십 데이터를 불러오지 못했습니다.", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  // 로그인 미완료 유저 진입 제한 게이트
  if (!user) {
    return (
      <Layout>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px",
          textAlign: "center"
        }}>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>로그인이 필요한 페이지예요.</p>
          <Button onClick={() => navigate("/login")}>로그인하러 가기</Button>
        </div>
      </Layout>
    );
  }

  // 가입 신청 처리 (토스페이먼츠 연동 결제 창 활성화)
  const handleSubscribe = async () => {
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

      // 결제 고유번호 생성
      const orderId = `MEMBERSHIP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      await tossPayments.requestPayment("카드", {
        amount: 4990,
        orderId,
        orderName: "WOW 멤버십 정기 구독",
        successUrl: `${window.location.origin}/membership/success`,
        failUrl: `${window.location.origin}/membership/fail`,
      });
    } catch (err) {
      console.error("결제 요청 중 오류가 발생했습니다.", err);
      alert("결제 진행 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  // 해지 신청 처리 (해지 예약 상태 변경)
  const handleCancel = async () => {
    try {
      await cancelMembership();
      const statusData = await getMembershipStatus();
      setMembership(statusData);
      setModalOpen(false);
      alert("멤버십 해지 예약이 정상 처리되었습니다. 만료일 전까지는 혜택이 유지됩니다.");
    } catch {
      alert("멤버십 해지 예약에 실패했습니다.");
    }
  };

  // 혜택 유지 처리 (해지 예약 취소)
  const handleKeep = async () => {
    try {
      await keepMembership();
      const statusData = await getMembershipStatus();
      setMembership(statusData);
      alert("와우 멤버십 회원 혜택 유지가 정상 완료되었습니다!");
    } catch {
      alert("멤버십 혜택 유지에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader title="WOW 멤버십" />
        <div style={{ textAlign: "center", padding: "80px", color: "var(--color-text-muted)" }}>로딩 중...</div>
      </Layout>
    );
  }

  // 날짜 출력용 포맷터
  const formatPayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  return (
    <Layout>
      <PageHeader title="WOW 멤버십" />
      <div className={styles.hero}>
        <p className={styles.brand}>WOW 멤버십</p>
        <p className={styles.priceLine}>월 4,990원</p>
      </div>

      <Card className={styles.benefits}>
        {BENEFITS.map((b) => (
          <div key={b} className={styles.benefit}>
            <Check size={18} className={styles.check} /> {b}
          </div>
        ))}
      </Card>

      {membership && membership.status === "ACTIVE" ? (
        <>
          <p className={styles.status}>✓ 이용 중 · 다음 결제일 {formatPayDate(membership.endDate)}</p>
          <Button variant="ghost" className={styles.cancel} onClick={() => setModalOpen(true)}>
            멤버십 해지
          </Button>
        </>
      ) : membership && membership.status === "CANCELLED" ? (
        <>
          <p className={styles.status}>해지 예약됨 · {formatPayDate(membership.endDate)} 이후 종료</p>
          <Button className={styles.join} onClick={handleKeep}>
            멤버십 유지하기
          </Button>
        </>
      ) : (
        <>
          <p className={styles.status} style={{ color: "var(--color-text-muted)" }}>
            지금 가입하시고 매달 3,000원의 배송비를 아끼세요!
          </p>
          <Button className={styles.join} onClick={handleSubscribe}>
            WOW 멤버십 지금 가입하기
          </Button>
        </>
      )}

      {/* 이탈방지⑥ 구독해지 록인 모달 (실시간 계산해온 금액 노출) */}
      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <p className={styles.lockTitle}>정말 해지하시겠어요?</p>
            <p className={styles.lockBody}>
              이번 달 멤버십으로 아낀 배송비가 <b className={styles.save}>{savedFee.toLocaleString()}원</b>이에요.
              지금 해지하면 다음 달부터 이 혜택이 사라져요.
            </p>
            <div className={styles.lockActions}>
              <Button className={styles.keep} onClick={() => setModalOpen(false)}>
                혜택 유지하기
              </Button>
              <Button
                variant="ghost"
                className={styles.confirm}
                onClick={handleCancel}
              >
                그래도 해지하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
