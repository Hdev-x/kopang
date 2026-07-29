import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { SkeletonRows } from "../../../components/Skeleton";
import { getAdminOrders, updateOrderShipStatus } from "../../../api/order";
import type { Order } from "../../../api/order";
import styles from "../adminTable.module.css";

/*
 * 주문 관리는 "처리 큐"다. 매일 같은 작업(발송·완료)을 반복하는 화면이라
 * ① 지금 뭘 처리해야 하는지가 즉시 보이고 ② 목록에서 바로 처리되어야 한다.
 * 그래서 상태 칩에 건수를 넣고, 행 끝에 처리 버튼을 둔다(상세 왕복 제거).
 */

type Ship = "배송준비" | "배송중" | "배송완료" | "취소" | "구매확정" | "-";

function shipLabel(orderStatus: string): Ship {
  if (orderStatus === "PAID") return "배송준비";
  if (orderStatus === "SHIPPING") return "배송중";
  if (orderStatus === "DELIVERED") return "배송완료";
  if (orderStatus === "CANCELLED") return "취소";
  if (orderStatus === "CONFIRMED") return "구매확정";
  return "-";
}

function shipTone(s: Ship, styleMap: Record<string, string>) {
  if (s === "배송완료" || s === "구매확정") return styleMap.bDone;
  if (s === "배송중") return styleMap.bInfo;
  if (s === "취소") return styleMap.bRisk;
  if (s === "배송준비") return styleMap.bWait;
  return styleMap.bMuted;
}

function payLabel(paymentStatus: string) {
  if (paymentStatus === "PAID") return "결제완료";
  if (paymentStatus === "PENDING") return "결제대기";
  return "취소";
}

const FILTERS = ["전체", "배송준비", "배송중", "배송완료", "취소"] as const;
type Filter = (typeof FILTERS)[number];

export function AdminOrdersPage() {
  // 전체를 한 번 받아 화면에서 거른다 — 칩에 건수를 띄우려면 전체가 필요하다
  // (상태별로 서버에 다시 물으면 다른 상태의 건수를 알 수 없다)
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<Filter>("전체");
  const [keyword, setKeyword] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    getAdminOrders()
      .then((list) => setOrders(list ?? []))
      .catch((e) => { console.error("주문 목록 조회 실패", e); setOrders([]); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { 전체: orders?.length ?? 0 };
    for (const f of FILTERS.slice(1)) base[f] = 0;
    for (const o of orders ?? []) {
      const s = shipLabel(o.orderStatus);
      if (s in base) base[s] += 1;
    }
    return base;
  }, [orders]);

  const shown = useMemo(() => {
    if (!orders) return [];
    const kw = keyword.trim();
    return orders.filter((o) => {
      const s = shipLabel(o.orderStatus);
      if (filter !== "전체" && s !== filter) return false;
      if (!kw) return true;
      return String(o.orderId).includes(kw) || (o.userName ?? "").includes(kw);
    });
  }, [orders, filter, keyword]);

  const handleShip = async (o: Order) => {
    const s = shipLabel(o.orderStatus);
    const next = s === "배송준비" ? "SHIPPING" : "DELIVERED";
    setBusyId(o.orderId);
    try {
      await updateOrderShipStatus(o.orderId, next);
      // 처리한 행을 목록에서 지우지 않는다 — 방금 무엇을 했는지 확인할 수 있어야 한다
      setOrders((prev) => prev?.map((x) => (x.orderId === o.orderId ? { ...x, orderStatus: next } : x)) ?? prev);
    } catch (e) {
      console.error("배송 상태 변경 실패", e);
      alert("배송 상태 업데이트에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const loading = orders === null;

  return (
    <AdminLayout title="주문 · 배송 관리" fullBleed>
      <div className={styles.page}>
        <div className={styles.toolbar}>
          {/* 상태 칩에 건수를 넣어 "오늘 처리할 양"을 요약 카드 없이 보여준다 */}
          <div className={styles.chips}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.chip} ${filter === f ? styles.chipOn : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}<b>{loading ? "\u00a0" : counts[f]?.toLocaleString() ?? 0}</b>
              </button>
            ))}
          </div>
          <span className={styles.spacer} />
          <label className={styles.search}>
            <Search size={15} />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="주문번호·주문자" />
          </label>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th style={{ width: 110 }}>주문번호</th>
                <th style={{ width: 140 }}>주문자</th>
                <th style={{ width: 130 }} className={styles.r}>결제금액</th>
                <th style={{ width: 110 }}>결제</th>
                <th style={{ width: 110 }}>배송</th>
                <th style={{ width: 130 }}>주문일시</th>
                <th style={{ width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={12} cols={7} widths={["64%", "56%", "70%", "58%", "54%", "72%", "50%"]} />
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    {(orders?.length ?? 0) === 0 ? "주문 내역이 없습니다." : "조건에 맞는 주문이 없습니다."}
                  </td>
                </tr>
              ) : (
                shown.map((o) => {
                  const s = shipLabel(o.orderStatus);
                  const actionable = s === "배송준비" || s === "배송중";
                  return (
                    <tr key={o.orderId}>
                      <td className={styles.name}>C{String(o.orderId).padStart(5, "0")}</td>
                      <td>{o.userName || "이름없음"}</td>
                      <td className={styles.r}>{o.totalPrice.toLocaleString()}원</td>
                      <td>
                        <span className={`${styles.badge} ${o.paymentStatus === "PAID" ? styles.bDone : styles.bMuted}`}>
                          {payLabel(o.paymentStatus)}
                        </span>
                      </td>
                      <td><span className={`${styles.badge} ${shipTone(s, styles)}`}>{s}</span></td>
                      <td className={styles.num}>{o.createdAt?.slice(0, 16).replace("T", " ")}</td>
                      <td>
                        <div className={styles.rowActions}>
                          {actionable && (
                            <button
                              type="button"
                              className={`${styles.btnGhost} ${styles.btnSmall}`}
                              disabled={busyId === o.orderId}
                              onClick={() => handleShip(o)}
                            >
                              {busyId === o.orderId ? "처리 중…" : s === "배송준비" ? "발송 처리" : "배송완료"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
