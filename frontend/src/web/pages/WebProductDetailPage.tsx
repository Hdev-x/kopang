import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Minus, PackageCheck, Plus, RotateCcw, Share2, ShieldCheck, Star, Truck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addToCart } from "../../api/cart";
import { getProduct } from "../../api/products";
import { getProductReviews, type Review } from "../../api/review";
import { getProductQnaList } from "../../api/qna";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../hooks/useWishlist";
import type { Product } from "../../types/product";
import type { CartItem } from "../../types/cart";
import type { QnaSummary } from "../../types/qna";
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

type DetailTab = "product-info" | "review" | "qna" | "delivery";

function readDetailTab(): DetailTab {
  const hash = window.location.hash.replace("#", "");
  return hash === "review" || hash === "qna" || hash === "delivery" ? hash : "product-info";
}

export function WebProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productQna, setProductQna] = useState<QnaSummary[]>([]);
  const [activeTab, setActiveTab] = useState<DetailTab>(readDetailTab);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const { isWished, toggleWishlist } = useWishlist();
  const [wishLoading, setWishLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const productId = Number(id);
    Promise.all([
      getProduct(productId),
      getProductReviews(productId).catch(() => []),
      getProductQnaList(productId).catch(() => []),
    ])
      .then(([productData, reviewData, qnaData]) => {
        setProduct(productData);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
        setProductQna(Array.isArray(qnaData) ? qnaData : []);
        setError(false);
        if (productData) {
          saveRecentProduct(productData);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    // 찜 여부는 useWishlist가 따로 들고 있어 로그인 상태가 바뀌어도 상품을 다시 받을 필요가 없다.
  }, [id]);

  useEffect(() => {
    if (!product) return;

    const sectionIds: DetailTab[] = ["product-info", "review", "qna", "delivery"];
    let scrollEndTimer = 0;

    const syncActiveTab = () => {
      // 헤더 73px + 탭 60px 아래가 실제로 보이는 첫 줄이다. 여유 25px을 둬서 조금 일찍 바뀐다.
      const activationLine = 158;
      let currentTab: DetailTab = "product-info";

      for (const sectionId of sectionIds) {
        const section = document.getElementById(sectionId);
        if (section && section.getBoundingClientRect().top <= activationLine) {
          currentTab = sectionId;
        }
      }

      setActiveTab((previous) => previous === currentTab ? previous : currentTab);
    };

    const handleScroll = () => {
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(syncActiveTab, 160);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    syncActiveTab();

    const initialTab = readDetailTab();
    if (initialTab !== "product-info") {
      window.requestAnimationFrame(() => {
        document.getElementById(initialTab)?.scrollIntoView({ block: "start" });
      });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(scrollEndTimer);
    };
  }, [product]);

  if (loading) return <WebLayout><div className={styles.status}>상품을 불러오는 중이에요.</div></WebLayout>;
  if (error || !product) return <WebLayout><div className={styles.status}>상품을 불러오지 못했어요.</div></WebLayout>;

  const salePrice = product.discountRate
    ? Math.round((product.price * (100 - product.discountRate)) / 100)
    : product.price;

  // 재고를 모르면(응답에 없음) 수량을 막지 않는다. 최종 검증은 주문 생성에서 한다.
  const stock = product.stock;
  const maxQuantity = stock && stock > 0 ? stock : 99;
  const soldOut = stock === 0;
  const stockNotice = soldOut
    ? "일시 품절된 상품이에요."
    : stock !== undefined && stock <= 10
      ? `재고가 ${stock}개 남았어요.`
      : "재고가 충분해 바로 배송할 수 있어요.";

  const handleToggleWishlist = async () => {
    if (!user) {
      if (window.confirm("로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?")) {
        navigate("/web/login");
      }
      return;
    }
    if (!product || wishLoading) return;
    setWishLoading(true);
    try {
      // 성공 안내는 하트 색 변화로 갈음한다 — 클릭마다 alert가 뜨면 탐색이 끊긴다.
      await toggleWishlist(product.id);
    } catch {
      window.alert("찜하기 처리에 실패했습니다.");
    } finally {
      setWishLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product.id, quantity)
      .then(() => window.alert("장바구니에 담았어요. 오른쪽 퀵바에서 확인해 보세요."))
      .catch(() => window.alert("장바구니 담기에 실패했어요."));
  };

  const handleDirectBuy = () => {
    if (product) {
      const directItem: CartItem = {
        itemId: Date.now(),
        productId: product.id,
        name: product.name,
        price: salePrice,
        originalPrice: product.price,
        discountPrice: salePrice,
        quantity: quantity,
        imageUrl: product.imageUrl || "",
      };
      navigate("/web/checkout", { state: { selectedItems: [directItem] } });
    }
  };

  const selectTab = (tab: DetailTab) => {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${tab}`);
    document.getElementById(tab)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const images = Array.from(
    new Set([product.imageUrl, ...(product.imageUrls ?? [])].filter(Boolean) as string[])
  );
  const currentImage = images[selectedImgIndex] || product.imageUrl || "";

  const handlePrevImage = () => {
    setSelectedImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const safeQna = Array.isArray(productQna) ? productQna : [];
  const reviewCount = safeReviews.length;
  const avgRatingNum =
    reviewCount > 0
      ? safeReviews.reduce((acc, r) => acc + (r?.rating || 0), 0) / reviewCount
      : 0;
  const avgRatingText = reviewCount > 0 ? avgRatingNum.toFixed(1) : "0.0";

  return (
    <WebLayout>
      <div className={styles.breadcrumb}>쇼핑홈 / 상품 / {product.name}</div>
      <section className={styles.productTop}>
        <div className={styles.gallery}>
          <div className={styles.thumbnails}>
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={index === selectedImgIndex ? styles.thumbActive : ""}
                onClick={() => setSelectedImgIndex(index)}
              >
                <img src={image} alt={`상품 썸네일 ${index + 1}`} />
              </button>
            ))}
          </div>
          <div className={styles.mainImage}>
            {currentImage ? <img src={currentImage} alt={product.name} /> : <div />}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.prevBtn}`}
                  onClick={handlePrevImage}
                  aria-label="이전 이미지"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.nextBtn}`}
                  onClick={handleNextImage}
                  aria-label="다음 이미지"
                >
                  <ChevronRight size={22} />
                </button>
                <span className={styles.imageCounter}>
                  {selectedImgIndex + 1} / {images.length}
                </span>
              </>
            )}
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

          <div className={styles.ratingSummary}>
            <Star size={17} fill="currentColor" />
            <strong>{avgRatingText}</strong>
            <button type="button" onClick={() => selectTab("review")}>({reviewCount}개 상품평)</button>
          </div>

          <div className={styles.priceBlock}>
            {product.discountRate ? <span className={styles.discount}>{product.discountRate}%</span> : null}
            <strong>{salePrice.toLocaleString()}원</strong>
            {product.discountRate ? <del>{product.price.toLocaleString()}원</del> : null}
          </div>

          <dl className={styles.delivery}>
            <dt>배송</dt><dd><strong>3,000원</strong> (제주/도서 4,500원 · 멤버십 회원 0원)<br />평균 1~2일 이내 도착 예정</dd>
            <dt>판매자</dt><dd>{product.brand ?? "Kopang 입점 판매자"}</dd>
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
              <button
                type="button"
                className={`${styles.wish} ${isWished(product.id) ? styles.wished : ""}`}
                aria-label={isWished(product.id) ? "찜 해제" : "찜하기"}
                aria-pressed={isWished(product.id)}
                disabled={wishLoading}
                onClick={handleToggleWishlist}
              >
                <Heart size={22} fill={isWished(product.id) ? "currentColor" : "none"} />
              </button>
              <button type="button" className={styles.cart} onClick={handleAddToCart} disabled={soldOut}>장바구니</button>
              <button type="button" className={styles.buy} onClick={handleDirectBuy} disabled={soldOut}>{soldOut ? "품절" : "바로구매"}</button>
            </div>
          </div>
        </div>
      </section>

      <nav id="web-detail-tabs" className={styles.tabs} aria-label="상품 상세 메뉴">
        <button type="button" className={activeTab === "product-info" ? styles.tabActive : ""} onClick={() => selectTab("product-info")}>상품정보</button>
        <button type="button" className={activeTab === "review" ? styles.tabActive : ""} onClick={() => selectTab("review")}>리뷰 {safeReviews.length}</button>
        <button type="button" className={activeTab === "qna" ? styles.tabActive : ""} onClick={() => selectTab("qna")}>문의 {safeQna.length}</button>
        <button type="button" className={activeTab === "delivery" ? styles.tabActive : ""} onClick={() => selectTab("delivery")}>배송/환불</button>
      </nav>

      <div className={styles.detailWorkspace}>
        <div className={styles.tabContent}>
      <section id="product-info" className={styles.detailSection}>
        {product.description && (
          <div className={styles.descWrapper}>
            <h2 className={styles.sectionHeader}>상품 상세정보</h2>
            <div
              className={`${styles.descriptionHtml} ${
                !isDescExpanded ? styles.descCollapsed : ""
              }`}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
            <button
              type="button"
              className={styles.expandBtn}
              onClick={() => setIsDescExpanded((prev) => !prev)}
            >
              {isDescExpanded ? "상세설명 접기 ∧" : "상품 상세설명 펼쳐보기 ∨"}
            </button>
          </div>
        )}

        {/* 전자상거래 고시 항목. 모바일 상세와 같은 구성·문구를 쓴다. */}
        <div className={styles.specContainer}>
          <h3 className={styles.specHeader}>상품 필수 정보 (전자상거래 고시)</h3>
          <table className={styles.specTable}>
            <tbody>
              <tr>
                <th>품명 및 모델명</th>
                <td>{product.name}</td>
              </tr>
              <tr>
                <th>제조사 / 브랜드</th>
                <td>{product.brand || "KOPANG 협력사"}</td>
              </tr>
              <tr>
                <th>상품번호</th>
                <td>{product.id}</td>
              </tr>
              <tr>
                <th>재고수량</th>
                <td>{typeof product.stock === "number" ? `${product.stock.toLocaleString()}개 남음` : "재고 보유 중"}</td>
              </tr>
              <tr>
                <th>A/S 책임자와 전화번호</th>
                <td>KOPANG 고객만족센터 (1544-0000)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="review" className={styles.communitySection}>
        <header className={styles.contentTitle}><p className={styles.sectionLabel}>REVIEW</p><h2>상품 리뷰 <span>{safeReviews.length}</span></h2></header>
        {safeReviews.length === 0 ? <div className={styles.placeholder}><strong>아직 작성된 리뷰가 없어요.</strong><p>첫 번째 구매 후기를 남겨주세요.</p></div> : (
          <div className={styles.reviewList}>
            {safeReviews.map((review) => (
              <article key={review.reviewId} className={styles.reviewCard}>
                <div className={styles.reviewMeta}><strong>{review.userName || "익명"}</strong><span>{review.createdAt?.slice(0, 10)}</span></div>
                <p className={styles.rating}>{"★".repeat(Math.round(review.rating))}{"☆".repeat(5 - Math.round(review.rating))}</p>
                <p className={styles.reviewText}>{review.content}</p>
                {review.image && <img src={review.image} alt="구매자 리뷰" />}
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="qna" className={styles.communitySection}>
        <header className={styles.contentTitleRow}>
          <div><p className={styles.sectionLabel}>Q&amp;A</p><h2>상품 문의 <span>{safeQna.length}</span></h2></div>
          <button type="button" onClick={() => navigate(`/web/qna/write?type=PRODUCT&productId=${product.id}`)}>상품 문의하기</button>
        </header>
        {safeQna.length === 0 ? <div className={styles.placeholder}><strong>등록된 상품 문의가 없어요.</strong><p>상품에 대해 궁금한 점을 문의해 주세요.</p></div> : (
          <div className={styles.qnaList}>
            {safeQna.map((item) => (
              <article key={item.id} className={styles.qnaCard}>
                <div><span className={item.status === "답변완료" ? styles.qnaDone : styles.qnaWaiting}>{item.status}</span><strong>Q. {item.title}</strong></div>
                <p>{item.author} · {item.createdAt?.slice(0, 10)}</p>
                {item.answerContent && <div className={styles.answer}>A. {item.answerContent}</div>}
              </article>
            ))}
          </div>
        )}
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
        </div>

        <aside className={styles.stickyPurchase} aria-label="구매 옵션">
          <p className={styles.stickyName}>{product.name}</p>
          <div className={styles.stickyBody}>
            <div className={styles.stickySelected}>
              <span>수량</span>
              <div className={styles.quantity}>
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="수량 줄이기"><Minus size={16} /></button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} disabled={quantity >= maxQuantity} aria-label="수량 늘리기"><Plus size={16} /></button>
              </div>
            </div>
            <div className={styles.bundleRow}><PackageCheck size={20} /><span>{stockNotice}</span></div>
          </div>
          <div className={styles.stickyBottom}>
            <div className={styles.stickyTotal}><span>주문금액</span><strong>{(salePrice * quantity).toLocaleString()}원</strong></div>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.wish} ${isWished(product.id) ? styles.wished : ""}`}
                aria-label={isWished(product.id) ? "찜 해제" : "찜하기"}
                aria-pressed={isWished(product.id)}
                disabled={wishLoading}
                onClick={handleToggleWishlist}
              >
                <Heart size={22} fill={isWished(product.id) ? "currentColor" : "none"} />
              </button>
              <button type="button" className={styles.cart} onClick={handleAddToCart} disabled={soldOut}>장바구니</button>
              <button type="button" className={styles.buy} onClick={handleDirectBuy} disabled={soldOut}>{soldOut ? "품절" : "바로구매"}</button>
            </div>
          </div>
        </aside>
      </div>
    </WebLayout>
  );
}
