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
  const navigate = useNavigate();

  useEffect(() => {
    getCart()
      .then(setItems)
      .catch((err) => console.error("장바구니 불러오기 실패:", err));
  }, []);

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
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || "장바구니 삭제에 실패했습니다.";
        alert(errMsg);
      });
  };

  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  return (
    <Layout>
      <PageHeader title="장바구니" />
      {items.length === 0 ? (
        <p>장바구니가 비었어요.</p>
      ) : (
        <>
          <div className={styles.list}>
            {items.map((it) => (
              <Card key={it.itemId} className={styles.item}>
                <Link to={`/products/${it.productId}`} className={styles.itemMain}>
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt={it.name} className={styles.thumb} />
                  ) : (
                    <div className={styles.thumb} />
                  )}
                  <div className={styles.info}>
                    <p className={styles.name}>{it.name}</p>
                    <p className={styles.price}>{it.price.toLocaleString()}원</p>
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
            <span>합계</span>
            <strong>{total.toLocaleString()}원</strong>
          </div>
          <Button className={styles.checkout} onClick={() => navigate("/checkout")}>
            주문하기
          </Button>
        </>
      )}
    </Layout>
  );
}
