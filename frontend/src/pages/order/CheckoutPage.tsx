import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { getCart } from "../../api/cart";
import { createOrder } from "../../api/order";
import type { CartItem } from "../../types/cart";
import styles from "./CheckoutPage.module.css";

const CLIENT_KEY = "test_ck_nRQoOaPz8LNMgv7d5bDPVy47BMw6";
const AVAILABLE_POINT = 1200;
const COUPONS = [
  { id: 0, name: "적용 안 함", discount: 0 },
  { id: 1, name: "신규가입 5,000원 할인", discount: 5000 },
  { id: 2, name: "생일 축하 3,000원 할인", discount: 3000 },
];

export function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [pay, setPay] = useState("신용/체크카드");
  const [couponId, setCouponId] = useState(0);
  const [pointInput, setPointInput] = useState("");

  useEffect(() => {
    getCart().then(setItems).catch(console.error);
  }, []);

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const couponDiscount = COUPONS.find((c) => c.id === couponId)?.discount ?? 0;
  const afterCoupon = Math.max(0, total - couponDiscount);
  const maxPoint = Math.min(AVAILABLE_POINT, afterCoupon);
  const pointUsed = Math.min(Math.max(0, Number(pointInput) || 0), maxPoint);
  const finalPrice = afterCoupon - pointUsed;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    try {
      // 같은 결제 세션에서 이미 생성된 PENDING 주문이 있으면 재사용
      const savedId = sessionStorage.getItem("checkout_pending_order_id");
      let orderId: number;

      if (savedId) {
        orderId = Number(savedId);
      } else {
        orderId = await createOrder({
          totalPrice: finalPrice,
          items: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            price: it.price,
          })),
        });
        sessionStorage.setItem("checkout_pending_order_id", String(orderId));
      }

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

      const firstItemName = items[0]?.name ?? "상품";
      const orderName =
        items.length > 1
          ? `${firstItemName} 외 ${items.length - 1}건`
          : firstItemName;

      await tossPayments.requestPayment("카드", {
        amount: finalPrice,
        orderId: `ORD-${orderId}`,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "주문 처리 중 오류가 발생했습니다.";
      alert(errMsg);
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <PageHeader title="주문/결제" />

        {/* ── 배송지 ── */}
        <p className={styles.section}>배송지</p>
        <div className={styles.card}>
          <p className={styles.name}>
            홍길동 <span className={styles.badge}>기본</span>
          </p>
          <p className={styles.muted}>010-1234-5678</p>
          <p className={styles.muted}>서울 강남구 테헤란로 123, 4층</p>
        </div>

        {/* ── 주문 상품 ── */}
        <p className={styles.section}>주문 상품</p>
        <div className={styles.card}>
          {items.map((it) => (
            <div key={it.itemId} className={styles.orderItem}>
              <span className={styles.orderItemName}>{it.name}</span>
              <span className={styles.orderItemQty}>{it.quantity}개</span>
              <span className={styles.orderItemPrice}>
                {(it.price * it.quantity).toLocaleString()}원
              </span>
            </div>
          ))}
        </div>

        {/* ── 쿠폰 / 포인트 ── */}
        <p className={styles.section}>쿠폰 / 포인트</p>
        <div className={styles.card}>
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
                  setPointInput(
                    String(Math.min(Number(e.target.value) || 0, maxPoint))
                  )
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
        </div>

        {/* ── 결제 수단 ── */}
        <p className={styles.section}>결제 수단</p>
        <div className={styles.card}>
          {["신용/체크카드", "가상계좌", "계좌이체", "휴대폰"].map((m) => (
            <label key={m} className={styles.radio}>
              <input type="radio" name="pay" checked={pay === m} onChange={() => setPay(m)} />
              {m}
            </label>
          ))}
        </div>

        {/* ── 금액 요약 + 결제 버튼 ── */}
        <div className={styles.summary}>
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
          <hr className={styles.divider} />
          <div className={styles.amountTotal}>
            <span className={styles.amountTotalLabel}>총 결제금액</span>
            <strong className={styles.amountTotalValue}>
              {finalPrice.toLocaleString()}원
            </strong>
          </div>
          <Button
            className={styles.pay}
            onClick={handleCheckout}
            disabled={items.length === 0}
          >
            {finalPrice.toLocaleString()}원 결제하기
          </Button>
        </div>
      </div>
    </Layout>
  );
}
