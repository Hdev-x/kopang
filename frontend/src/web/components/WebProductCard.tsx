import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { addWishlist, checkWishlist, deleteWishlist } from "../../api/wishlist";
import { useAuth } from "../../hooks/useAuth";
import type { Product } from "../../types/product";
import styles from "./WebProductCard.module.css";

export function WebProductCard({ product }: { product: Product }) {
  const user = useAuth();
  const navigate = useNavigate();
  const [isWished, setIsWished] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && product.id) {
      checkWishlist(product.id)
        .then(setIsWished)
        .catch(() => setIsWished(false));
    }
  }, [user, product.id]);

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
      if (isWished) {
        await deleteWishlist(product.id);
        setIsWished(false);
      } else {
        await addWishlist(product.id);
        setIsWished(true);
      }
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
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" /> : <div />}
          <button
            type="button"
            className={styles.wish}
            aria-label="찜하기"
            onClick={handleWishToggle}
            style={{ color: isWished ? "#ff4d4f" : "inherit" }}
          >
            <Heart size={20} fill={isWished ? "#ff4d4f" : "none"} color={isWished ? "#ff4d4f" : "currentColor"} />
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
