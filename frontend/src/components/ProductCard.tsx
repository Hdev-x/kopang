import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import type { Product } from "../types/product";
import styles from "./ProductCard.module.css";

type Props = { product: Product };

export function ProductCard({ product }: Props) {
  return (
    <Link to={`/products/${product.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={styles.thumb}
            loading="lazy"
          />
        ) : (
          <div className={styles.thumb} />
        )}
        <button
          type="button"
          className={styles.heart}
          aria-label="찜"
          onClick={(e) => {
            e.preventDefault(); // 카드 이동 막고 찜만
            // TODO: 찜 토글
          }}
        >
          <Heart size={18} strokeWidth={2.2} />
        </button>
      </div>

      {product.brand && <p className={styles.brand}>{product.brand}</p>}
      <p className={styles.name}>{product.name}</p>
      <p className={styles.priceRow}>
        {product.discountRate ? (
          <span className={styles.discount}>{product.discountRate}%</span>
        ) : null}
        <span className={styles.price}>{product.price.toLocaleString()}원</span>
      </p>
    </Link>
  );
}
