import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { getProduct } from "../api/products";
import type { Product } from "../types/product";
import styles from "./ProductDetailPage.module.css";

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (id) getProduct(Number(id)).then(setProduct).catch(console.error);
  }, [id]);

  if (!product) {
    return (
      <Layout>
        <p>불러오는 중...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.image} />
      <h1 className={styles.name}>{product.name}</h1>
      <p className={styles.price}>{product.price.toLocaleString()}원</p>
      <p className={styles.desc}>{product.description}</p>
      <Button className={styles.cta}>장바구니 담기</Button>

      {/* 비슷상품 추천 (content-based ML) 자리 */}
      <h2 className={styles.section}>비슷한 상품</h2>
      <div className={styles.similarRow}>
        {[1, 2, 3].map((n) => (
          <Card key={n} className={styles.similarCard}>
            <div className={styles.similarThumb} />
            <p className={styles.similarName}>추천 상품 {n}</p>
          </Card>
        ))}
      </div>

      {/* 포토 리뷰(착샷) 자리 */}
      <h2 className={styles.section}>리뷰</h2>
      <Card>
        <p className={styles.rating}>★★★★★</p>
        <p>믿고 먹는 코팡 신선식품! (착샷 영역)</p>
      </Card>
    </Layout>
  );
}
