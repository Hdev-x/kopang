import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { checkWishlist, addWishlist, deleteWishlist } from "../api/wishlist";
import type { Product } from "../types/product";
import styles from "./ProductCard.module.css";

type Props = { 
  product: Product;
  onWishChange?: (productId: number, isWished: boolean) => void;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function ProductCard({ product, onWishChange, onClick }: Props) {
  const user = useAuth();
  const navigate = useNavigate();
  const [wished, setWished] = useState(false);

  useEffect(() => {
    if (user) {
      checkWishlist(product.id)
        .then(setWished)
        .catch(console.error);
    } else {
      setWished(false);
    }
  }, [product.id, user]);

  const handleWishToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      if (window.confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동할까요?")) {
        navigate("/login");
      }
      return;
    }

    if (wished) {
      deleteWishlist(product.id)
        .then(() => {
          setWished(false);
          if (onWishChange) onWishChange(product.id, false);
        })
        .catch(console.error);
    } else {
      addWishlist(product.id)
        .then(() => {
          setWished(true);
          if (onWishChange) onWishChange(product.id, true);
        })
        .catch(console.error);
    }
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
