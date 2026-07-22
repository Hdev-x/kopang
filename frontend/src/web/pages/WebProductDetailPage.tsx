import { useEffect, useState } from "react";
import { Heart, Minus, Plus, Share2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addToCart } from "../../api/cart";
import { getProduct } from "../../api/products";
import type { Product } from "../../types/product";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebProductDetailPage.module.css";

function saveRecentProduct(product: Product) {
  try {
    const current = JSON.parse(localStorage.getItem("kopang_recent_products") ?? "[]") as Product[];
    const next = [product, ...current.filter((item) => item.id !== product.id)].slice(0, 12);
    localStorage.setItem("kopang_recent_products", JSON.stringify(next));
  } catch {
    localStorage.removeItem("kopang_recent_products");
  }
}

export function WebProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProduct(Number(id))
      .then((data) => {
        setProduct(data);
        setError(false);
        saveRecentProduct(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <WebLayout><div className={styles.status}>상품을 불러오는 중이에요.</div></WebLayout>;
  if (error || !product) return <WebLayout><div className={styles.status}>상품을 불러오지 못했어요.</div></WebLayout>;

  const salePrice = product.discountRate
    ? Math.round((product.price * (100 - product.discountRate)) / 100)
    : product.price;

  const handleAddToCart = () => {
    addToCart(product.id, quantity)
      .then(() => window.alert("장바구니에 담았어요. 오른쪽 퀵바에서 확인해 보세요."))
      .catch(() => window.alert("장바구니 담기에 실패했어요."));
  };

  return (
    <WebLayout>
      <div className={styles.breadcrumb}>쇼핑홈 / 상품 / {product.name}</div>
      <section className={styles.productTop}>
        <div className={styles.gallery}>
          <div className={styles.thumbnails}>
            {[product.imageUrl, ...(product.imageUrls ?? [])].filter(Boolean).slice(0, 5).map((image, index) => (
              <button key={`${image}-${index}`} type="button"><img src={image} alt="" /></button>
            ))}
          </div>
          <div className={styles.mainImage}>
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div />}
          </div>
        </div>

        <div className={styles.info}>
          <div className={styles.infoHead}>
            <div>
              {product.brand && <Link to="/web/products" className={styles.brand}>{product.brand}</Link>}
              <h1>{product.name}</h1>
            </div>
            <button type="button" aria-label="공유하기"><Share2 size={22} /></button>
          </div>

          <div className={styles.priceBlock}>
            {product.discountRate ? <span className={styles.discount}>{product.discountRate}%</span> : null}
            <strong>{salePrice.toLocaleString()}원</strong>
            {product.discountRate ? <del>{product.price.toLocaleString()}원</del> : null}
          </div>

          <dl className={styles.delivery}>
            <dt>배송</dt><dd>무료배송 · 평균 2~3일 이내 도착</dd>
            <dt>혜택</dt><dd>구매 금액의 최대 2% 적립</dd>
          </dl>

          <div className={styles.purchaseBox}>
            <div className={styles.selectedProduct}>
              <span>{product.name}</span>
              <div className={styles.quantity}>
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={16} /></button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => value + 1)}><Plus size={16} /></button>
              </div>
            </div>
            <div className={styles.total}><span>주문금액</span><strong>{(salePrice * quantity).toLocaleString()}원</strong></div>
            <div className={styles.actions}>
              <button type="button" className={styles.wish} aria-label="찜하기"><Heart size={22} /></button>
              <button type="button" className={styles.cart} onClick={handleAddToCart}>장바구니</button>
              <button type="button" className={styles.buy} onClick={() => navigate("/checkout")}>바로구매</button>
            </div>
          </div>
        </div>
      </section>

      <nav className={styles.tabs} aria-label="상품 상세 메뉴">
        <a href="#product-info">상품정보</a>
        <a href="#review">리뷰</a>
        <a href="#qna">문의</a>
        <a href="#delivery">배송/환불</a>
      </nav>
      <section id="product-info" className={styles.detailSection}>
        <h2>상품정보</h2>
        <p>{product.description ?? "상품 상세 설명은 실제 데이터와 디자인 레퍼런스를 연결해 보완할 예정입니다."}</p>
      </section>
    </WebLayout>
  );
}
