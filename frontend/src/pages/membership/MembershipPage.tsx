import { useState } from "react";
import { Check } from "lucide-react";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import styles from "./MembershipPage.module.css";

const BENEFITS = ["무료배송 무제한", "구매액 2% 적립", "회원 단독 특가·쿠폰", "무료 반품"];

export function MembershipPage() {
  const [active, setActive] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Layout>
      <PageHeader />
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

      {active ? (
        <>
          <p className={styles.status}>✓ 이용 중 · 다음 결제일 2026.07.15</p>
          <Button variant="ghost" className={styles.cancel} onClick={() => setModalOpen(true)}>
            멤버십 해지
          </Button>
        </>
      ) : (
        <>
          <p className={styles.status}>해지 예약됨 · 2026.07.15 이후 종료</p>
          <Button className={styles.join} onClick={() => setActive(true)}>
            멤버십 유지하기
          </Button>
        </>
      )}

      {/* 이탈방지⑥ 구독해지 록인 모달 (개요: 아낀 배송비 실시간 연산 → 목업은 고정값) */}
      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <p className={styles.lockTitle}>정말 해지하시겠어요?</p>
            <p className={styles.lockBody}>
              이번 달 멤버십으로 아낀 배송비가 <b className={styles.save}>32,000원</b>이에요.
              지금 해지하면 다음 달부터 이 혜택이 사라져요.
            </p>
            <div className={styles.lockActions}>
              <Button className={styles.keep} onClick={() => setModalOpen(false)}>
                혜택 유지하기
              </Button>
              <Button
                variant="ghost"
                className={styles.confirm}
                onClick={() => {
                  setActive(false);
                  setModalOpen(false);
                }}
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
