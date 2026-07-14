import { useState, useEffect } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { getAdminOrders, updateOrderShipStatus } from "../../../api/order";
import type { Order } from "../../../api/order";
import sh from "../adminShared.module.css";

const TABS = ["전체", "배송준비", "배송중", "배송완료", "취소"];

function getShipLabel(status: string) {
  if (status === "PAID") return "배송준비";
  if (status === "SHIPPING") return "배송중";
  if (status === "DELIVERED") return "배송완료";
  if (status === "CANCELLED") return "취소";
  if (status === "CONFIRMED") return "구매확정";
  return "-";
}

function shipBadge(s: string) {
  if (s === "배송완료") return sh.bOk;
  if (s === "배송중") return sh.bInfo;
  if (s === "취소") return sh.bDanger;
  if (s === "배송준비") return sh.bWarn;
  return sh.bMuted;
}

export function AdminOrdersPage() {
  const [tab, setTab] = useState("전체");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders(tab);
      setOrders(data || []);
    } catch (e) {
      console.error("주문 목록 조회 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tab]);

  const handleShipUpdate = async (orderId: number, currentShip: string) => {
    const nextStatus = currentShip === "배송준비" ? "SHIPPING" : "DELIVERED";
    try {
      await updateOrderShipStatus(orderId, nextStatus);
      fetchOrders();
    } catch (e) {
      alert("배송 상태 업데이트에 실패했습니다.");
      console.error(e);
    }
  };

  return (
    <AdminLayout title="주문 · 배송 관리">
      <div className={sh.toolbar}>
        <div className={sh.filters}>
          {TABS.map((t) => (
            <button key={t} className={`${sh.chip} ${tab === t ? sh.chipActive : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={sh.list}>
        {loading ? (
          <div>로딩 중...</div>
        ) : orders.length === 0 ? (
          <div>주문 내역이 없습니다.</div>
        ) : (
          orders.map((o) => {
            const shipLabel = getShipLabel(o.orderStatus);
            const paidLabel = o.paymentStatus === "PAID" ? "결제완료" : o.paymentStatus === "PENDING" ? "결제대기" : "취소";
            return (
              <Card key={o.orderId}>
                <div className={sh.itemHead}>
                  <span className={sh.itemTitle}>ORD-{o.orderId}</span>
                  <span className={`${sh.badge} ${shipBadge(shipLabel)}`}>{shipLabel}</span>
                </div>
                <div className={sh.itemBottom}>
                  <span className={sh.itemMetaInline}>
                    {o.userName || "이름없음"} · ₩{o.totalPrice.toLocaleString()} · {paidLabel}
                  </span>
                  {(shipLabel === "배송준비" || shipLabel === "배송중") && (
                    <Button variant="ghost" size="sm" onClick={() => handleShipUpdate(o.orderId, shipLabel)}>
                      {shipLabel === "배송준비" ? "발송 처리" : "배송완료"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
}
