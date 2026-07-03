import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { getOrders, deleteOrder, formatOrderStatus } from "../../api/order";
import type { Order } from "../../api/order";
import s from "../../styles/AccountPages.module.css";

export function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch((err) => console.error("주문 목록 불러오기 실패:", err));
  }, []);

  const handleDelete = (e: React.MouseEvent, orderId: number) => {
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

  return (
    <Layout>
      <PageHeader title="주문내역" />
      <div className={s.list}>
        {orders.length === 0 ? (
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
              <Link key={o.orderId} to={`/my/orders/${o.orderId}`} className={s.cardLink}>
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
                            {formatOrderStatus(o.paymentStatus)}
                          </span>
                          {canDelete && (
                            <button
                              type="button"
                              className={s.deleteBtn}
                              onClick={(e) => handleDelete(e, o.orderId)}
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
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </Layout>
  );
}

