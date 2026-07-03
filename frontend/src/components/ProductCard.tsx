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
      
      {product.discountRate && product.discountRate > 0 ? (
        <div className={styles.priceRow}>
          <div className={styles.discountArea}>
            <span className={styles.discount}>{product.discountRate}%</span>
            <span className={styles.originalPrice}>{product.price.toLocaleString()}원</span>
          </div>
          <span className={styles.price}>
            {Math.round((product.price * (100 - product.discountRate)) / 100).toLocaleString()}원
          </span>
        </div>
      ) : (
        <div className={styles.priceRow}>
          <span className={styles.price}>{product.price.toLocaleString()}원</span>
        </div>
      )}
    </Link>
  );
}
