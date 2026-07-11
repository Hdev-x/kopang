import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { WriteReviewModal } from "../../components/WriteReviewModal";
import { getOrders, deleteOrder, formatOrderStatus } from "../../api/order";
import { getMyReviews, deleteReview } from "../../api/review";
import type { Order } from "../../api/order";
import type { Review } from "../../api/review";
import s from "../../styles/AccountPages.module.css";

export function OrderHistoryPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "reviews">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);

  // 리뷰 작성을 위해 선택된 상품 ID와 수정 모드 대상 리뷰
  const [activeReviewProductId, setActiveReviewProductId] = useState<number | null>(null);
  const [reviewToEdit, setReviewToEdit] = useState<Review | undefined>(undefined);

  const fetchOrders = () => {
    getOrders()
      .then((data) => {
        const sortedOrders = [...data].sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeB !== timeA) {
            return timeB - timeA;
          }
          return b.orderId - a.orderId;
        });
        setOrders(sortedOrders);
      })
      .catch((err) => console.error("주문 목록 불러오기 실패:", err));
  };

  const fetchMyReviews = () => {
    getMyReviews()
      .then(setMyReviews)
      .catch((err) => console.error("내 리뷰 목록 불러오기 실패:", err));
  };

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else {
      fetchMyReviews();
    }
  }, [activeTab]);

  const handleDeleteOrder = (e: React.MouseEvent, orderId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("이 주문 내역을 삭제하시겠습니까? (삭제된 내역은 복구할 수 없습니다.)")) {
      return;
    }

    deleteOrder(orderId)
      .then(() => {
        alert("주문 내역이 삭제되었습니다.");
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || "주문 내역 삭제에 실패했습니다.";
        alert(errMsg);
      });
  };

  const handleDeleteReview = (reviewId: number) => {
    if (!window.confirm("이 리뷰를 삭제하시겠습니까?")) {
      return;
    }

    deleteReview(reviewId)
      .then(() => {
        alert("리뷰가 삭제되었습니다.");
        fetchMyReviews();
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || "리뷰 삭제에 실패했습니다.";
        alert(errMsg);
      });
  };

  return (
    <Layout>
      <PageHeader title="주문내역" />

      {/* 상단 탭 */}
      <div className={s.tabs}>
        <button
          className={`${s.tab} ${activeTab === "orders" ? s.tabActive : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          주문내역
        </button>
        <button
          className={`${s.tab} ${activeTab === "reviews" ? s.tabActive : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          내 리뷰
        </button>
      </div>

      <div className={s.list}>
        {activeTab === "orders" ? (
          orders.length === 0 ? (
            <p className={s.empty}>주문 내역이 없습니다.</p>
          ) : (
            orders.map((o) => {
              const first = o.items && o.items.length > 0 ? o.items[0] : null;
              const label = first
                ? (first.name ?? "상품") + (o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : "")
                : "주문 상품 정보 없음";
              const dateStr = o.createdAt ? o.createdAt.split("T")[0] : "";

              // PAID 상태가 아닌 경우(즉, PENDING 또는 CANCELLED)에만 삭제 가능
              const canDelete = o.paymentStatus !== "PAID";

              return (
                <div key={o.orderId} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link to={`/my/orders/${o.orderId}`} className={s.cardLink}>
                    <Card>
                      <div className={s.orderRow}>
                        {first?.imageUrl ? (
                          <img src={first.imageUrl} alt={first.name} className={s.thumb} />
                        ) : (
                          <div className={s.thumb} />
                        )}
                        <div className={s.orderInfo}>
                          <div className={s.row}>
                            <span className={s.muted}>{dateStr}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className={s.muted}>
                                {(() => {
                                  const paymentLabel = formatOrderStatus(o.paymentStatus);
                                  const shipStatusLabel = o.orderStatus === "PAID" ? "배송준비" : formatOrderStatus(o.orderStatus);
                                  const showShipLabel = o.paymentStatus === "PAID" && o.orderStatus !== "CANCELLED" && o.orderStatus !== "RETURNED";
                                  return showShipLabel ? `${paymentLabel} (${shipStatusLabel})` : paymentLabel;
                                })()}
                              </span>
                              {canDelete && (
                                <button
                                  type="button"
                                  className={s.deleteBtn}
                                  onClick={(e) => handleDeleteOrder(e, o.orderId)}
                                  aria-label="주문 삭제"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p>{label}</p>
                          <p className={s.strong}>{o.totalPrice.toLocaleString()}원</p>
                        </div>
                      </div>

                      {/* 주문내역 리스트에서 배송완료 시 상품별 리뷰 작성 노출 */}
                      {o.orderStatus === "DELIVERED" && o.items && o.items.length > 0 && (
                        <div
                          style={{
                            marginTop: "12px",
                            borderTop: "1px dashed var(--color-border)",
                            paddingTop: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                          }}
                          onClick={(e) => {
                            // Link 카드 클릭 이벤트 버블링 방지
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          {o.items.map((it) => (
                            <div
                              key={it.productId}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "13px"
                              }}
                            >
                              <span style={{ color: "var(--color-text)", fontWeight: "500" }}>
                                {it.name}
                              </span>
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
                                onClick={() => {
                                  setReviewToEdit(undefined);
                                  setActiveReviewProductId(it.productId);
                                }}
                              >
                                리뷰 작성
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </Link>
                </div>
              );
            })
          )
        ) : (
          /* 내 리뷰 목록 탭 */
          myReviews.length === 0 ? (
            <p className={s.empty}>작성한 리뷰가 없습니다.</p>
          ) : (
            myReviews.map((r) => (
              <Link key={r.reviewId} to={`/products/${r.productId}`} className={s.cardLink}>
                <Card>
                  <div className={r.image ? s.reviewWithImg : s.reviewPlain}>
                    {r.image && <img src={r.image} alt="리뷰 이미지" className={s.reviewThumb} />}
                    <div className={s.reviewContent}>
                      <div className={s.reviewHeader}>
                        <div className={s.reviewRating}>
                          {"★".repeat(Math.round(r.rating))}
                          {"☆".repeat(5 - Math.round(r.rating))}
                        </div>
                        <div className={s.reviewActions}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={s.reviewBtn}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setReviewToEdit(r);
                              setActiveReviewProductId(r.productId);
                            }}
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={s.reviewBtn}
                            style={{ color: "var(--red-600)", borderColor: "var(--red-200)" }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteReview(r.reviewId);
                            }}
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                      {r.productName && <p className={s.reviewProduct}>[{r.productName}]</p>}
                      <p style={{ margin: "4px 0 0", fontSize: "14px" }}>{r.content}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )
        )}
      </div>

      {activeReviewProductId !== null && (
        <WriteReviewModal
          productId={activeReviewProductId}
          reviewToEdit={reviewToEdit}
          onClose={() => {
            setActiveReviewProductId(null);
            setReviewToEdit(undefined);
          }}
          onSuccess={() => {
            setActiveReviewProductId(null);
            setReviewToEdit(undefined);
            if (activeTab === "orders") {
              fetchOrders();
            } else {
              fetchMyReviews();
            }
          }}
        />
      )}
    </Layout>
  );
}
