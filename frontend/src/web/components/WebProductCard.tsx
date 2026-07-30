import { useEffect, useState } from "react";
import { Heart, Image } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { addWishlist, checkWishlist, deleteWishlist } from "../../api/wishlist";
import { useAuth } from "../../hooks/useAuth";
import type { Product } from "../../types/product";
import styles from "./WebProductCard.module.css";

export function WebProductCard({ product }: { product: Product }) {
  const user = useAuth();
  const navigate = useNavigate();
  const [wished, setWished] = useState(false);
  const [wishPending, setWishPending] = useState(false);
  const salePrice = product.discountRate
    ? Math.round((product.price * (100 - product.discountRate)) / 100)
    : product.price;

  useEffect(() => {
    if (!user) return;
    checkWishlist(product.id).then(setWished).catch(() => setWished(false));
  }, [product.id, user]);

  const isWished = Boolean(user) && wished;

  const handleWishToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      navigate("/web/login");
      return;
    }
    if (wishPending) return;
    setWishPending(true);
    try {
      if (isWished) await deleteWishlist(product.id);
      else await addWishlist(product.id);
      setWished((current) => !current);
    } finally {
      setWishPending(false);
    }
  };

  return (
    <article className={styles.card}>
      <Link to={`/web/products/${product.id}`} className={styles.link}>
        <div className={styles.imageWrap}>
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" /> : <div className={styles.imageFallback}><Image size={32} /><span>KOPANG</span></div>}
          <button type="button" className={`${styles.wish} ${isWished ? styles.wished : ""}`} aria-label={isWished ? "찜 해제" : "찜하기"} aria-pressed={isWished} disabled={wishPending} onClick={handleWishToggle}>
            <Heart size={22} fill={isWished ? "currentColor" : "none"} />
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
