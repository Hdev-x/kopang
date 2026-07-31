import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { AddToCartModal } from "../../components/AddToCartModal";
import { getProduct, getAIRecommendations } from "../../api/products";
import { addToCart } from "../../api/cart";
import { useWishlist } from "../../hooks/useWishlist";
import { getProductReviews } from "../../api/review";
import { getProductQnaList } from "../../api/qna";
import { useAuth } from "../../hooks/useAuth";
import { recordProductView } from "../../api/productViews";
import { getMembershipStatus } from "../../api/membership";
import { calculateShippingFee } from "../../utils/shipping";
import type { Product } from "../../types/product";
import type { CartItem } from "../../types/cart";
import type { Review } from "../../api/review";
import styles from "./ProductDetailPage.module.css";
import type { QnaSummary } from "../../types/qna";
import { Link } from "react-router-dom";

type DetailTab = "product-info" | "review" | "qna" | "delivery";

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("product-info");
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [togetherProducts, setTogetherProducts] = useState<Product[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const { isWished, toggleWishlist } = useWishlist();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [productQna, setProductQna] = useState<QnaSummary[]>([]);
  const [isMembership, setIsMembership] = useState(false);

  useEffect(() => {
    if (id) {
      const prodId = Number(id);
      setLoadingRecommendations(true);
      getProduct(prodId).then(setProduct).catch(console.error);
      getAIRecommendations(prodId)
        .then((data) => {
          setSimilarProducts(data.similarProducts || []);
          setTogetherProducts(data.frequentlyBoughtTogether || []);
        })
        .catch(console.error)
        .finally(() => setLoadingRecommendations(false));
      getProductReviews(prodId).then(setReviews).catch(console.error);
      getProductQnaList(prodId)
        .then(setProductQna)
        .catch(console.error);

      if (user) {
        recordProductView(prodId).catch(console.error);
        getMembershipStatus()
          .then((status) => setIsMembership(Boolean(status && (status.status === "ACTIVE" || status.status === "CANCELLED"))))
          .catch(() => setIsMembership(false));
      } else {
        setIsMembership(false);
      }
    }
  }, [id, user]);

  if (!product) {
    return (
      <Layout>
        <p>불러오는 중...</p>
      </Layout>
    );
  }

  const handleWishToggle = () => {
    if (!user) {
      if (window.confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동할까요?")) {
        navigate("/login");
      }
      return;
    }

    if (id) {
      toggleWishlist(Number(id)).catch(console.error);
    }
  };

  const discounted = product.discountRate
    ? Math.round((product.price * (100 - product.discountRate)) / 100)
    : product.price;

  const handleDirectBuy = () => {
    if (!user) {
      if (window.confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동할까요?")) {
        navigate("/login");
      }
      return;
    }
    if (id && product) {
      const directItem: CartItem = {
        itemId: Date.now(),
        productId: product.id,
        name: product.name,
        price: discounted,
        originalPrice: product.price,
        discountPrice: discounted,
        quantity: quantity,
        imageUrl: product.imageUrl || "",
      };
      navigate("/checkout", { state: { selectedItems: [directItem] } });
    }
  };

  const images = Array.from(
    new Set([product.imageUrl, ...(product.imageUrls || [])].filter(Boolean) as string[])
  );
  const currentImage = images[selectedImgIndex] || product.imageUrl || "";

  const handlePrevImage = () => {
    setSelectedImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const reviewCount = reviews.length;
  const avgRatingNum =
    reviewCount > 0
      ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewCount
      : 0;
  const avgRatingText = reviewCount > 0 ? avgRatingNum.toFixed(1) : "0.0";
  const starsString =
    "★".repeat(Math.round(avgRatingNum)) + "☆".repeat(5 - Math.round(avgRatingNum));

  const scrollToTab = (targetTab: DetailTab) => {
    setActiveTab(targetTab);
    const elem = document.getElementById(targetTab);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Layout>
      {/* 이미지 갤러리 영역 */}
      <div className={styles.galleryContainer}>
        <div className={styles.mainImageWrapper}>
          {currentImage ? (
            <img src={currentImage} alt={product.name} className={styles.image} />
          ) : (
            <div className={styles.image} />
          )}

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

        {/* 하단 썸네일 목록 */}
        {images.length > 1 && (
          <div className={styles.thumbnailList}>
            {images.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                className={`${styles.thumbnailBtn} ${
                  idx === selectedImgIndex ? styles.thumbnailActive : ""
                }`}
                onClick={() => setSelectedImgIndex(idx)}
              >
                <img src={img} alt={`상품 썸네일 ${idx + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 브랜드 및 상품명 */}
      {product.brand && <p className={styles.brand}>{product.brand}</p>}
      <h1 className={styles.name}>{product.name}</h1>

      {/* 동적 리뷰 요약 뱃지 (첫번째 사진) */}
      <div className={styles.ratingSummary}>
        <span className={styles.stars}>{starsString}</span>
        <span className={styles.ratingScore}>{avgRatingText}</span>
        <button type="button" className={styles.reviewLink} onClick={() => scrollToTab("review")}>
          ({reviewCount}개 상품평)
        </button>
      </div>

      {/* 가격 영역 */}
      <div className={styles.priceContainer}>
        {product.discountRate ? (
          <div className={styles.originalPriceRow}>
            <span className={styles.discountBadge}>{product.discountRate}%</span>
            <span className={styles.originPrice}>{product.price.toLocaleString()}원</span>
          </div>
        ) : null}
        <div className={styles.finalPriceRow}>
          <strong className={styles.finalPrice}>{discounted.toLocaleString()}</strong>
          <span className={styles.priceUnit}>원</span>
        </div>
      </div>

      {/* 수량 선택 및 총 상품금액 계산 */}
      <div className={styles.quantityBox}>
        <div className={styles.quantityControl}>
          <span className={styles.quantityLabel}>수량</span>
          <div className={styles.quantityButtons}>
            <button
              type="button"
              onClick={() => setQuantity((v) => Math.max(1, v - 1))}
              disabled={quantity <= 1}
            >
              -
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((v) => v + 1)}>
              +
            </button>
          </div>
        </div>
        <div className={styles.totalPriceRow}>
          <span className={styles.totalLabel}>총 상품금액</span>
          <div className={styles.totalPriceGroup}>
            <strong className={styles.totalValue}>
              {(discounted * quantity).toLocaleString()}
            </strong>
            <span className={styles.totalUnit}>원</span>
          </div>
        </div>
      </div>

      {/* 배송비 안내 */}
      {(() => {
        const ship = calculateShippingFee({ isMembership });
        return (
          <div className={styles.shippingBox}>
            <div className={styles.shippingRow}>
              <span className={styles.shippingTitle}>🚚 배송비</span>
              <strong className={styles.shippingFeeText}>
                {ship.fee === 0 ? "무료배송" : `${ship.fee.toLocaleString()}원`}
              </strong>
              {ship.badge && <span className={styles.shippingBadge}>{ship.badge}</span>}
            </div>
            {!isMembership && (
              <p className={styles.shippingSubText}>
                기본 3,000원 (제주/도서산간 4,500원) ·{" "}
                <Link to="/membership" className={styles.membershipLink}>
                  멤버십 가입 시 어디든 무료배송
                </Link>
              </p>
            )}
          </div>
        );
      })()}

      {/* 하단 CTA (장바구니/바로구매) */}
      <div className={styles.ctaRow}>
        <button
          type="button"
          className={`${styles.wish} ${isWished(product.id) ? styles.wishOn : ""}`}
          onClick={handleWishToggle}
          aria-label="찜"
        >
          <Heart size={22} strokeWidth={2.2} fill={isWished(product.id) ? "currentColor" : "none"} />
        </button>
        <Button
          className={`${styles.cta} ${styles.cartBtn}`}
          onClick={() => {
            if (id) {
              addToCart(Number(id), quantity)
                .then(() => setModalOpen(true))
                .catch((err) => {
                  const errMsg = err.response?.data?.message || "장바구니 담기에 실패했습니다.";
                  alert(errMsg);
                });
            }
          }}
        >
          장바구니
        </Button>
        <Button className={`${styles.cta} ${styles.buyBtn}`} onClick={handleDirectBuy}>
          바로 구매
        </Button>
      </div>

      {/* 4대 탭 네비게이션 (두 번째 사진) */}
      <nav id="detail-nav-tabs" className={styles.stickyTabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "product-info" ? styles.tabBtnActive : ""}`}
          onClick={() => scrollToTab("product-info")}
        >
          상품정보
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "review" ? styles.tabBtnActive : ""}`}
          onClick={() => scrollToTab("review")}
        >
          리뷰 {reviewCount}
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "qna" ? styles.tabBtnActive : ""}`}
          onClick={() => scrollToTab("qna")}
        >
          문의 {productQna.length}
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "delivery" ? styles.tabBtnActive : ""}`}
          onClick={() => scrollToTab("delivery")}
        >
          배송/환불
        </button>
      </nav>

      {/* [1] 상품정보 섹션 */}
      <section id="product-info" className={styles.sectionBlock}>
        {product.description && (
          <div className={styles.descContainer}>
            <h2 className={styles.sectionHeader}>상품 상세정보</h2>
            <div
              className={`${styles.descHtml} ${
                !isDescExpanded ? styles.descCollapsed : ""
              }`}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
            <button
              type="button"
              className={styles.expandToggleBtn}
              onClick={() => setIsDescExpanded((prev) => !prev)}
            >
              {isDescExpanded ? "상세설명 접기 ∧" : "상품 상세설명 펼쳐보기 ∨"}
            </button>
          </div>
        )}

        {/* 필수 정보 표기란 스펙 테이블 */}
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
                <td>{typeof product.stock === "number" ? `${product.stock}개 남음` : "재고 보유 중"}</td>
              </tr>
              <tr>
                <th>A/S 책임자와 전화번호</th>
                <td>KOPANG 고객만족센터 (1544-0000)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* [2] 리뷰 섹션 */}
      <section id="review" className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <h2>상품 리뷰 <span className={styles.highlightCount}>{reviewCount}</span></h2>
        </div>

        {reviews.length === 0 ? (
          <p className={styles.emptyReview}>아직 작성된 리뷰가 없습니다.</p>
        ) : (
          reviews.map((r) => (
            <Card key={r.reviewId} className={styles.review}>
              <div className={r.image ? styles.reviewWithImg : styles.reviewPlain}>
                {r.image && <img src={r.image} alt="리뷰 이미지" className={styles.reviewThumb} />}
                <div className={styles.reviewContent}>
                  <p className={styles.rating}>
                    {"★".repeat(Math.round(r.rating || 5))}
                    {"☆".repeat(5 - Math.round(r.rating || 5))}{" "}
                    <span className={styles.reviewer}>{r.userName || "익명"}</span>
                  </p>
                  <p>{r.content}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </section>

      {/* [3] 문의 섹션 */}
      <section id="qna" className={styles.sectionBlock}>
        <div className={styles.sectionHeaderRow}>
          <h2>상품 문의 <span className={styles.highlightCount}>{productQna.length}</span></h2>
          <Button
            variant="ghost"
            className={styles.askBtnInline}
            onClick={() => navigate(`/qna/write?type=PRODUCT&productId=${id}`)}
          >
            상품 문의하기
          </Button>
        </div>

        {productQna.length === 0 ? (
          <p className={styles.emptyReview}>등록된 상품 문의가 없습니다.</p>
        ) : (
          productQna.map((item) => (
            <Card key={item.id} className={styles.review}>
              <p className={styles.qnaQ}>
                Q. {item.title}
                <span className={`${styles.qnaStatus} ${item.status === "답변완료" ? styles.done : styles.wait}`}>
                  {item.status}
                </span>
              </p>
              {item.answerContent && <p className={styles.qnaA}>A. {item.answerContent}</p>}
            </Card>
          ))
        )}
      </section>

      {/* [4] 배송/환불 안내 섹션 (세 번째 사진 참고) */}
      <section id="delivery" className={styles.shoppingGuideSection}>
        <div className={styles.guideHeader}>
          <p className={styles.guideSubTitle}>SHOPPING GUIDE</p>
          <h2 className={styles.guideTitle}>배송·교환·환불 안내</h2>
          <p className={styles.guideDesc}>구매 전에 아래 내용을 확인해 주세요.</p>
        </div>

        <div className={styles.guideCards}>
          <div className={styles.guideCard}>
            <div className={styles.guideCardHeader}>
              <span className={styles.guideIcon}>🚚</span>
              <h3>배송 안내</h3>
            </div>
            <p>결제 완료 후 평균 2~3영업일 이내 출고됩니다. 지역과 상품 종류에 따라 일정이 달라질 수 있습니다.</p>
          </div>

          <div className={styles.guideCard}>
            <div className={styles.guideCardHeader}>
              <span className={styles.guideIcon}>🔄</span>
              <h3>교환·반품</h3>
            </div>
            <p>상품 수령 후 7일 이내 신청할 수 있습니다. 단순 변심은 반품 배송비가 발생할 수 있습니다.</p>
          </div>

          <div className={styles.guideCard}>
            <div className={styles.guideCardHeader}>
              <span className={styles.guideIcon}>🛡️</span>
              <h3>환불 안내</h3>
            </div>
            <p>반품 상품 검수가 완료되면 결제 수단에 따라 순차적으로 환불됩니다.</p>
          </div>
        </div>

        <div className={styles.guideNoticeBox}>
          <p>상품별 판매자 정책이 우선 적용될 수 있으며, 정확한 조건은 주문 전에 상품 고지 내용을 확인해야 합니다.</p>
        </div>
      </section>

      {/* 비슷한 상품 */}
      {(loadingRecommendations || similarProducts.length > 0) && (
        <>
          <h2 className={styles.section}>비슷한 상품</h2>
          <div className={styles.similarRow}>
            {loadingRecommendations ? (
              [1, 2, 3, 4].map((n) => (
                <Card key={n} className={styles.similarCard}>
                  <div className={styles.skeletonThumb} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLineShort} />
                </Card>
              ))
            ) : (
              similarProducts.map((sim, idx) => {
                const hasDiscount = Boolean(sim.discountRate && sim.discountRate > 0);
                const discountedPrice = hasDiscount
                  ? Math.round((sim.price * (100 - (sim.discountRate || 0))) / 100)
                  : sim.price;
                return (
                  <Card
                    key={sim.id ? `sim-${sim.id}-${idx}` : `sim-${idx}`}
                    className={styles.similarCard}
                    onClick={() => sim.id && navigate(`/products/${sim.id}`)}
                  >
                    {sim.imageUrl ? (
                      <img src={sim.imageUrl} alt={sim.name || "상품 이미지"} className={styles.similarThumb} />
                    ) : (
                      <div className={styles.similarThumb} />
                    )}
                    <p className={styles.similarName}>{sim.name || "상품명 없음"}</p>
                    {hasDiscount ? (
                      <div className={styles.similarPriceArea}>
                        <span className={styles.similarDiscount}>{sim.discountRate}%</span>
                        <span className={styles.similarPrice}>{discountedPrice.toLocaleString()}원</span>
                      </div>
                    ) : (
                      <p className={styles.similarPrice}>{(sim.price ?? 0).toLocaleString()}원</p>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      {/* 함께 구매하면 좋은 상품 */}
      {(loadingRecommendations || togetherProducts.length > 0) && (
        <>
          <h2 className={styles.section}>함께 구매하면 좋은 상품</h2>
          <div className={styles.similarRow}>
            {loadingRecommendations ? (
              [1, 2, 3, 4].map((n) => (
                <Card key={n} className={styles.similarCard}>
                  <div className={styles.skeletonThumb} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLineShort} />
                </Card>
              ))
            ) : (
              togetherProducts.map((item, idx) => {
                const hasDiscount = Boolean(item.discountRate && item.discountRate > 0);
                const discountedPrice = hasDiscount
                  ? Math.round((item.price * (100 - (item.discountRate || 0))) / 100)
                  : item.price;
                return (
                  <Card
                    key={item.id ? `tog-${item.id}-${idx}` : `tog-${idx}`}
                    className={styles.similarCard}
                    onClick={() => item.id && navigate(`/products/${item.id}`)}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name || "상품 이미지"} className={styles.similarThumb} />
                    ) : (
                      <div className={styles.similarThumb} />
                    )}
                    <p className={styles.similarName}>{item.name || "상품명 없음"}</p>
                    {hasDiscount ? (
                      <div className={styles.similarPriceArea}>
                        <span className={styles.similarDiscount}>{item.discountRate}%</span>
                        <span className={styles.similarPrice}>{discountedPrice.toLocaleString()}원</span>
                      </div>
                    ) : (
                      <p className={styles.similarPrice}>{(item.price ?? 0).toLocaleString()}원</p>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      <AddToCartModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Layout>
  );
}
