import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { getCart } from "../api/cart";
import type { CartItem } from "../types/cart";
import styles from "./CartPage.module.css";

export function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getCart()
      .then(setItems)
      .catch((err) => console.error("장바구니 불러오기 실패:", err));
  }, []);

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
              <Link
                key={it.itemId}
                to={`/products/${it.productId}`}
                className={styles.itemLink}
              >
                <Card className={styles.item}>
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt={it.name} className={styles.thumb} />
                  ) : (
                    <div className={styles.thumb} />
                  )}
                  <div className={styles.info}>
                    <p className={styles.name}>{it.name}</p>
                    <p className={styles.price}>{it.price.toLocaleString()}원</p>
                    <p className={styles.qty}>수량 {it.quantity}</p>
                  </div>
                </Card>
              </Link>
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
