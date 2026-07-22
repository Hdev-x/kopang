import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../../types/product";
import styles from "./WebProductCard.module.css";

export function WebProductCard({ product }: { product: Product }) {
  const salePrice = product.discountRate
    ? Math.round((product.price * (100 - product.discountRate)) / 100)
    : product.price;

  return (
    <article className={styles.card}>
      <Link to={`/web/products/${product.id}`} className={styles.link}>
        <div className={styles.imageWrap}>
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" /> : <div />}
          <button type="button" className={styles.wish} aria-label="찜하기" onClick={(event) => event.preventDefault()}>
            <Heart size={22} />
          </button>
        </div>
        {product.brand && <p className={styles.brand}>{product.brand}</p>}
        <h3>{product.name}</h3>
        <div className={styles.priceRow}>
          {product.discountRate ? <span className={styles.discount}>{product.discountRate}%</span> : null}
          <strong>{salePrice.toLocaleString()}원</strong>
        </div>
      </Link>
    </article>
  );
}
