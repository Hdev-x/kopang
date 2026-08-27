import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useWishlist } from "../hooks/useWishlist";
import type { Product } from "../types/product";
import { calculateSalePrice, floorToTen } from "../utils/price";
import styles from "./ProductCard.module.css";

type Props = { 
  product: Product;
  onWishChange?: (productId: number, isWished: boolean) => void;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function ProductCard({ product, onWishChange, onClick }: Props) {
  const user = useAuth();
  const navigate = useNavigate();
  const { isWished, toggleWishlist } = useWishlist();

  const wished = isWished(product.id);

  const handleWishToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      if (window.confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동할까요?")) {
        navigate("/login");
      }
      return;
    }

    toggleWishlist(product.id)
      .then((next) => onWishChange?.(product.id, next))
      .catch(console.error);
  };

  return (
    <Link to={`/products/${product.id}`} className={styles.card} onClick={onClick}>
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
          className={`${styles.heart} ${wished ? styles.heartOn : ""}`}
          aria-label="찜"
          onClick={handleWishToggle}
        >
          <Heart size={18} strokeWidth={2.2} fill={wished ? "currentColor" : "none"} />
        </button>
      </div>

      {product.brand && <p className={styles.brand}>{product.brand}</p>}
      <p className={styles.name}>{product.name}</p>
      
      {product.discountRate && product.discountRate > 0 ? (
        <div className={styles.priceRow}>
          <div className={styles.discountArea}>
            <span className={styles.discount}>{product.discountRate}%</span>
            <span className={styles.originalPrice}>{floorToTen(product.price).toLocaleString()}원</span>
          </div>
          <span className={styles.price}>
            {calculateSalePrice(product.price, product.discountRate).toLocaleString()}원
          </span>
        </div>
      ) : (
        <div className={styles.priceRow}>
          <span className={styles.price}>{floorToTen(product.price).toLocaleString()}원</span>
        </div>
      )}
    </Link>
  );
}
