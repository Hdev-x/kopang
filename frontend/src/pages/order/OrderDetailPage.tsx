import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { getOrderDetails, cancelOrder, refundOrder, formatOrderStatus } from "../../api/order";
import { Button } from "../../components/Button";
import { WriteReviewModal } from "../../components/WriteReviewModal";
import type { Order } from "../../api/order";
import s from "../../styles/AccountPages.module.css";

export function OrderDetailPage() {
  const { no } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(!!no);
  const [activeReviewProductId, setActiveReviewProductId] = useState<number | null>(null);

  useEffect(() => {
    if (no) {
      getOrderDetails(Number(no))
        .then(setOrder)
        .catch((err) => console.error("주문 상세 불러오기 실패:", err))
        .finally(() => setLoading(false));
    }
  }, [no]);

  const handleCancel = () => {
    if (!order) return;
    if (!window.confirm("정말로 이 주문을 취소하시겠습니까?")) return;
    cancelOrder(order.orderId)
      .then(() => {
        alert("주문이 성공적으로 취소되었습니다.");
        setOrder((prev) => (prev ? { ...prev, paymentStatus: "CANCELLED" } : null));
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || "주문 취소에 실패했습니다.";
        alert(errMsg);
      });
  };

  const handleRefund = () => {
    if (!order) return;
    if (!window.confirm("정말로 이 주문을 환불 신청하시겠습니까?")) return;
    refundOrder(order.orderId)
      .then(() => {
        alert("환불 신청이 성공적으로 접수되었습니다.");
        setOrder((prev) => (prev ? { ...prev, orderStatus: "RETURNED" } : null));
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || "환불 신청에 실패했습니다.";
        alert(errMsg);
      });
  };

  const handleExchange = () => {
    alert("교환 신청이 성공적으로 접수되었습니다. 고객센터에서 신속히 안내해 드리겠습니다.");
  };

  // PENDING 주문은 위젯이 있는 재결제 페이지로 이동
  const handlePayNow = () => {
    if (!order) return;
    navigate(`/checkout/resume/${order.orderId}`);
  };

  if (loading) {
    return (
      <Layout>
        <p className={s.empty}>불러오는 중...</p>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <p className={s.empty}>주문을 찾을 수 없어요.</p>
      </Layout>
    );
  }

  const dateStr = order.createdAt ? order.createdAt.split("T")[0] : "";
  const dummyTracking = [
    { step: "결제완료", done: order.paymentStatus === "PAID" || order.orderStatus === "PAID" || order.orderStatus === "SHIPPING" || order.orderStatus === "DELIVERED" },
    { step: "상품준비중", done: order.orderStatus === "PAID" || order.orderStatus === "SHIPPING" || order.orderStatus === "DELIVERED" },
    { step: "배송중", done: order.orderStatus === "SHIPPING" || order.orderStatus === "DELIVERED" },
    { step: "배송완료", done: order.orderStatus === "DELIVERED" },
  ];

  return (
    <Layout>
      <PageHeader title="주문 상세" />

      <Card>
        <div className={s.row}>
          <span className={s.muted}>주문번호</span>
          <span>ORD-{order.orderId}</span>
        </div>
        <div className={s.row}>
          <span className={s.muted}>주문일</span>
          <span>{dateStr}</span>
        </div>
        <div className={s.row}>
          <span className={s.muted}>결제상태</span>
          <span>{formatOrderStatus(order.paymentStatus)}</span>
        </div>
        {order.paymentStatus === "PENDING" && (
          <div className={s.row} style={{ marginTop: "12px", justifyContent: "flex-end", gap: "8px" }}>
            <Button variant="ghost" size="sm" onClick={handleCancel} style={{ color: "var(--red-600)", borderColor: "var(--red-200)" }}>
              주문 취소
            </Button>
            <Button size="sm" onClick={handlePayNow}>
              결제 진행하기
            </Button>
          </div>
        )}
        {order.paymentStatus === "PAID" && (
          <div className={s.row} style={{ marginTop: "12px", justifyContent: "flex-end", gap: "8px" }}>
            {(order.orderStatus === "ORDERED" || order.orderStatus === "PAID") && (
              <Button variant="ghost" size="sm" onClick={handleCancel} style={{ color: "var(--red-600)", borderColor: "var(--red-200)" }}>
                주문 취소
              </Button>
            )}
            {order.orderStatus === "DELIVERED" && (
              <>
                <Button variant="ghost" size="sm" onClick={handleRefund} style={{ color: "var(--orange-600)", borderColor: "var(--orange-200)" }}>
                  환불 신청
                </Button>
                <Button size="sm" onClick={handleExchange}>
                  교환 신청
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      {/* 배송현황 */}
      <h2 className={s.section}>배송현황</h2>
      <Card>
        <div className={s.track}>
          {dummyTracking.map((t) => (
            <div key={t.step} className={`${s.trackStep} ${t.done ? s.trackDone : ""}`}>
              <span className={s.dot} />
              <span>{t.step}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 주문 상품 (상품 누르면 상세로) */}
      <h2 className={s.section}>주문 상품</h2>
      <div className={s.list}>
        {order.items && order.items.map((it) => {
          return (
            <Link key={it.productId} to={`/products/${it.productId}`} className={s.cardLink}>
              <Card>
                <div className={s.orderRow}>
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt={it.name} className={s.thumb} />
                  ) : (
                    <div className={s.thumb} />
                  )}
                  <div className={s.orderInfo}>
                    <div className={s.row}>
                      <span>{it.name ?? "상품"}</span>
                      <span className={s.muted}>{it.quantity}개</span>
                    </div>
                    <div className={s.row} style={{ alignItems: "center", marginTop: "4px" }}>
                      <p className={s.strong} style={{ margin: 0 }}>
                        {(it.price * it.quantity).toLocaleString()}원
                      </p>
                      {order.orderStatus === "DELIVERED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          style={{
                            fontSize: "12px",
                            padding: "4px 8px",
                            height: "auto",
                            borderColor: "var(--color-primary-200, #bfdbfe)",
                            color: "var(--color-primary, #2563eb)"
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveReviewProductId(it.productId);
                          }}
                        >
                          리뷰 작성
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className={s.totalRow}>
        <span>총 결제금액</span>
        <span>{order.totalPrice.toLocaleString()}원</span>
      </div>

      {activeReviewProductId !== null && (
        <WriteReviewModal
          productId={activeReviewProductId}
          onClose={() => setActiveReviewProductId(null)}
          onSuccess={() => setActiveReviewProductId(null)}
        />
      )}
    </Layout>
  );
}
