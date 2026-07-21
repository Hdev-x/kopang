import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { getCart, updateCartItem, deleteCartItem } from "../../api/cart";
import type { CartItem } from "../../types/cart";
import styles from "./CartPage.module.css";

export function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    getCart()
      .then((data) => {
        setItems(data);
        // 기본적으로 모든 아이템 선택
        setSelectedIds(new Set(data.map((i) => i.itemId)));
      })
      .catch((err) => console.error("장바구니 불러오기 실패:", err));
  }, []);

  const handleToggleSelect = (itemId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.itemId)));
    }
  };

  const handleQtyChange = (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    updateCartItem(itemId, newQty)
      .then(() => {
        setItems((prev) =>
          prev.map((it) => (it.itemId === itemId ? { ...it, quantity: newQty } : it))
        );
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || "수량 수정에 실패했습니다.";
        alert(errMsg);
      });
  };

  const handleDelete = (itemId: number) => {
    deleteCartItem(itemId)
      .then(() => {
        setItems((prev) => prev.filter((it) => it.itemId !== itemId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || "장바구니 삭제에 실패했습니다.";
        alert(errMsg);
      });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `담은 날짜: ${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const selectedItems = items.filter((it) => selectedIds.has(it.itemId));
  const total = selectedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("주문할 상품을 선택해주세요.");
      return;
    }
    navigate("/checkout", { state: { selectedItems } });
  };

  return (
    <Layout>
      <PageHeader title="장바구니" />
      {items.length === 0 ? (
        <p>장바구니가 비었어요.</p>
      ) : (
        <>
          <div className={styles.selectAllRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={items.length > 0 && selectedIds.size === items.length}
                onChange={handleToggleAll}
              />
              전체 선택 ({selectedIds.size}/{items.length})
            </label>
          </div>

          <div className={styles.list}>
            {items.map((it) => (
              <Card key={it.itemId} className={styles.item}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedIds.has(it.itemId)}
                  onChange={() => handleToggleSelect(it.itemId)}
                />
                <Link to={`/products/${it.productId}`} className={styles.itemMain}>
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt={it.name} className={styles.thumb} />
                  ) : (
                    <div className={styles.thumb} />
                  )}
                  <div className={styles.info}>
                    <p className={styles.name}>{it.name}</p>
                    <p className={styles.price}>{it.price.toLocaleString()}원</p>
                    {it.addedAt && <p className={styles.dateTag}>{formatDate(it.addedAt)}</p>}
                  </div>
                </Link>
                <div className={styles.actions}>
                  <div className={styles.quantityControl}>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(it.itemId, it.quantity - 1)}
                      className={styles.qtyBtn}
                      disabled={it.quantity <= 1}
                    >
                      -
                    </button>
                    <span className={styles.quantity}>{it.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(it.itemId, it.quantity + 1)}
                      className={styles.qtyBtn}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(it.itemId)}
                    className={styles.deleteBtn}
                  >
                    삭제
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div className={styles.summary}>
            <span>총 {selectedItems.length}개 선택</span>
            <strong>{total.toLocaleString()}원</strong>
          </div>
          <Button className={styles.checkout} onClick={handleCheckout} disabled={selectedItems.length === 0}>
            {selectedItems.length > 0 ? `${selectedItems.length}개 상품 주문하기` : "주문할 상품을 선택하세요"}
          </Button>
        </>
      )}
    </Layout>
  );
}
