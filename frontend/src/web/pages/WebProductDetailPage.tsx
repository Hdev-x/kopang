import { useEffect, useState } from "react";
import { Heart, Minus, PackageCheck, Plus, RotateCcw, Share2, ShieldCheck, Truck } from "lucide-react";
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
        <header className={styles.detailIntro}>
          <p>KOPANG PRODUCT STORY</p>
          <h2>일상에 자연스럽게 스며드는<br />{product.name}</h2>
          <span>{product.description ?? "필요한 기능과 편안한 사용 경험을 균형 있게 담은 상품입니다."}</span>
        </header>

        <div className={styles.editorialImage}>
          {product.imageUrl ? <img src={product.imageUrl} alt={`${product.name} 연출 이미지`} /> : <div />}
        </div>

        <section className={styles.storyBlock}>
          <div className={styles.storyCopy}>
            <p>POINT 01</p>
            <h3>매일 사용하기 좋은<br />단정한 기본</h3>
            <span>복잡한 장식을 덜어내고 상품 본연의 쓰임에 집중했습니다. 어느 공간에서도 자연스럽게 어울리는 구성을 확인해 보세요.</span>
          </div>
          <div className={styles.storyVisual}>
            {product.imageUrl ? <img src={product.imageUrl} alt="상품 특징" /> : <div />}
          </div>
        </section>

        <section className={styles.benefits} aria-label="상품 주요 특징">
          <article><PackageCheck size={28} /><h3>꼼꼼한 상품 검수</h3><p>출고 전 상품 상태를 확인하고 안전하게 포장합니다.</p></article>
          <article><ShieldCheck size={28} /><h3>안심 구매</h3><p>상품 정보와 주문 내역을 기준으로 구매 과정을 보호합니다.</p></article>
          <article><Truck size={28} /><h3>배송 현황 확인</h3><p>주문 후 마이페이지에서 배송 진행 상태를 확인할 수 있습니다.</p></article>
        </section>

        <section className={styles.specSection}>
          <div>
            <p className={styles.sectionLabel}>PRODUCT INFO</p>
            <h2>상품 기본정보</h2>
          </div>
          <dl className={styles.specTable}>
            <dt>상품명</dt><dd>{product.name}</dd>
            <dt>브랜드</dt><dd>{product.brand ?? "Kopang 입점 판매자"}</dd>
            <dt>상품번호</dt><dd>{product.id}</dd>
            <dt>카테고리</dt><dd>{product.categoryId ?? "상세 카테고리 확인 필요"}</dd>
            <dt>재고상태</dt><dd>{typeof product.stock === "number" ? `${product.stock.toLocaleString()}개` : "판매자 확인"}</dd>
            <dt>판매가</dt><dd>{salePrice.toLocaleString()}원</dd>
          </dl>
        </section>
      </section>

      <section id="review" className={styles.communitySection}>
        <div><p className={styles.sectionLabel}>REVIEW</p><h2>상품 리뷰</h2></div>
        <div className={styles.placeholder}><strong>리뷰 영역</strong><p>기존 리뷰 API와 Web 디자인을 연결할 예정입니다.</p></div>
      </section>

      <section id="qna" className={styles.communitySection}>
        <div><p className={styles.sectionLabel}>Q&amp;A</p><h2>상품 문의</h2></div>
        <div className={styles.placeholder}><strong>상품 문의 영역</strong><p>문의 목록과 작성 기능을 Web 화면에 맞게 연결할 예정입니다.</p></div>
      </section>

      <section id="delivery" className={styles.policySection}>
        <header>
          <p className={styles.sectionLabel}>SHOPPING GUIDE</p>
          <h2>배송·교환·환불 안내</h2>
          <span>구매 전에 아래 내용을 확인해 주세요.</span>
        </header>
        <div className={styles.policyGrid}>
          <article>
            <Truck size={26} />
            <div><h3>배송 안내</h3><p>결제 완료 후 평균 2~3영업일 이내 출고됩니다. 지역과 상품 종류에 따라 일정이 달라질 수 있습니다.</p></div>
          </article>
          <article>
            <RotateCcw size={26} />
            <div><h3>교환·반품</h3><p>상품 수령 후 7일 이내 신청할 수 있습니다. 단순 변심은 반품 배송비가 발생할 수 있습니다.</p></div>
          </article>
          <article>
            <ShieldCheck size={26} />
            <div><h3>환불 안내</h3><p>반품 상품 검수가 완료되면 결제 수단에 따라 순차적으로 환불됩니다.</p></div>
          </article>
        </div>
        <p className={styles.policyNotice}>상품별 판매자 정책이 우선 적용될 수 있으며, 정확한 조건은 주문 전에 상품 고지 내용을 확인해야 합니다.</p>
      </section>
    </WebLayout>
  );
}
