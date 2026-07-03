import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { getCart } from "../../api/cart";
import type { CartItem } from "../../types/cart";
import styles from "./CheckoutPage.module.css";

const PAY_METHODS = ["코팡페이 간편결제", "신용/체크카드", "무통장입금"];
const AVAILABLE_POINT = 1200;
const COUPONS = [
  { id: 0, name: "적용 안 함", discount: 0 },
  { id: 1, name: "신규가입 5,000원 할인", discount: 5000 },
  { id: 2, name: "생일 축하 3,000원 할인", discount: 3000 },
];

export function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [pay, setPay] = useState(PAY_METHODS[0]);
  const [couponId, setCouponId] = useState(0);
  const [pointInput, setPointInput] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getCart().then(setItems).catch(console.error);
  }, []);

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const couponDiscount = COUPONS.find((c) => c.id === couponId)?.discount ?? 0;
  const afterCoupon = Math.max(0, total - couponDiscount);
  const maxPoint = Math.min(AVAILABLE_POINT, afterCoupon); // 쿠폰 적용 후 잔액·보유 한도
  const pointUsed = Math.min(Math.max(0, Number(pointInput) || 0), maxPoint);
  const finalPrice = afterCoupon - pointUsed;

  return (
    <Layout>
      <PageHeader title="주문/결제" />

      <h2 className={styles.section}>배송지</h2>
      <Card className={styles.card}>
        <p className={styles.name}>
          홍길동 <span className={styles.badge}>기본</span>
        </p>
        <p className={styles.muted}>010-1234-5678</p>
        <p className={styles.muted}>서울 강남구 테헤란로 123, 4층</p>
      </Card>

      <h2 className={styles.section}>주문 상품</h2>
      <Card className={styles.card}>
        {items.map((it) => (
          <div key={it.itemId} className={styles.orderItem}>
            <span>{it.name}</span>
            <span className={styles.muted}>{it.quantity}개</span>
          </div>
        ))}
      </Card>

      <h2 className={styles.section}>쿠폰 / 포인트</h2>
      <Card className={styles.card}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>쿠폰</span>
          <select
            className={styles.select}
            value={couponId}
            onChange={(e) => setCouponId(Number(e.target.value))}
          >
            {COUPONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>포인트</span>
          <div className={styles.pointRow}>
            <input
              className={styles.pointInput}
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={pointInput}
              onChange={(e) =>
                setPointInput(String(Math.min(Number(e.target.value) || 0, maxPoint)))
              }
            />
            <button
              type="button"
              className={styles.allBtn}
              onClick={() => setPointInput(String(maxPoint))}
            >
              전액사용
            </button>
          </div>
        </div>
        <p className={styles.pointHint}>보유 {AVAILABLE_POINT.toLocaleString()}P</p>
      </Card>

      <h2 className={styles.section}>결제 수단</h2>
      <Card className={styles.card}>
        {PAY_METHODS.map((m) => (
          <label key={m} className={styles.radio}>
            <input type="radio" name="pay" checked={pay === m} onChange={() => setPay(m)} />
            {m}
          </label>
        ))}
      </Card>

      <div className={styles.amount}>
        <div className={styles.amountRow}>
          <span>상품금액</span>
          <span>{total.toLocaleString()}원</span>
        </div>
        {couponDiscount > 0 && (
          <div className={styles.amountRow}>
            <span>쿠폰 할인</span>
            <span className={styles.discount}>-{couponDiscount.toLocaleString()}원</span>
          </div>
        )}
        {pointUsed > 0 && (
          <div className={styles.amountRow}>
            <span>포인트 사용</span>
            <span className={styles.discount}>-{pointUsed.toLocaleString()}원</span>
          </div>
        )}
        <div className={styles.amountRow}>
          <span>배송비</span>
          <span>무료</span>
        </div>
        <div className={`${styles.amountRow} ${styles.amountTotal}`}>
          <span>총 결제금액</span>
          <strong>{finalPrice.toLocaleString()}원</strong>
        </div>
      </div>

      <Button className={styles.pay} onClick={() => navigate("/order/complete")}>
        {finalPrice.toLocaleString()}원 결제하기
      </Button>
    </Layout>
  );
}
