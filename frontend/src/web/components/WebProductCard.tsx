import { useState } from "react";
import { Heart, Image as ImageIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../hooks/useWishlist";
import type { Product } from "../../types/product";
import styles from "./WebProductCard.module.css";

export function WebProductCard({ product }: { product: Product }) {
  const user = useAuth();
  const navigate = useNavigate();
  const { isWished, toggleWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);

  const wished = isWished(product.id);

  const handleWishToggle = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      if (window.confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동하시겠습니까?")) {
        navigate("/web/login");
      }
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      await toggleWishlist(product.id);
    } catch {
      window.alert("찜하기 처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const salePrice = product.discountRate
    ? Math.round((product.price * (100 - product.discountRate)) / 100)
    : product.price;

  return (
    <article className={styles.card}>
      <Link to={`/web/products/${product.id}`} className={styles.link}>
        <div className={styles.imageWrap}>
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} loading="lazy" />
            : <div className={styles.imageFallback} aria-hidden="true"><ImageIcon size={32} /><span>KOPANG</span></div>}
          <button
            type="button"
            className={styles.wish}
            aria-label={wished ? "찜 해제" : "찜하기"}
            disabled={loading}
            onClick={handleWishToggle}
            style={{ color: wished ? "#ff4d4f" : "inherit" }}
          >
            <Heart size={20} fill={wished ? "#ff4d4f" : "none"} color={wished ? "#ff4d4f" : "currentColor"} />
          </button>
        </div>
        {product.brand && <p className={styles.brand}>{product.brand}</p>}
        <h3>{product.name}</h3>
        {product.discountRate && product.discountRate > 0 ? (
          <div className={styles.priceContainer}>
            <div className={styles.discountRow}>
              <span className={styles.discount}>{product.discountRate}%</span>
              <span className={styles.originalPrice}>{product.price.toLocaleString()}원</span>
            </div>
            <strong className={styles.salePrice}>{salePrice.toLocaleString()}원</strong>
          </div>
        ) : (
          <div className={styles.priceRow}>
            <strong>{product.price.toLocaleString()}원</strong>
          </div>
        )}
      </Link>
    </article>
  );
}
