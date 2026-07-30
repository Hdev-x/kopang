import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, CreditCard, Heart, Minus, PackageCheck, Plus, RotateCcw, Share2, ShieldCheck, Star, Truck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addToCart } from "../../api/cart";
import { getProduct } from "../../api/products";
import { getProductReviews, type Review } from "../../api/review";
import { getProductQnaList } from "../../api/qna";
import { addWishlist, checkWishlist, deleteWishlist } from "../../api/wishlist";
import { useAuth } from "../../hooks/useAuth";
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
  const [benefitOpen, setBenefitOpen] = useState(true);
  const [cardOpen, setCardOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [wished, setWished] = useState(false);
  const [wishPending, setWishPending] = useState(false);

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
        setReviews(reviewData);
        setProductQna(qnaData);
        setError(false);
        saveRecentProduct(productData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    checkWishlist(Number(id)).then(setWished).catch(() => setWished(false));
  }, [id, user]);

  useEffect(() => {
    if (!product) return;

    const sectionIds: DetailTab[] = ["product-info", "review", "qna", "delivery"];
    let scrollEndTimer = 0;

    const syncActiveTab = () => {
      const activationLine = 210;
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

  const handleWish = async () => {
    if (!user) {
      navigate("/web/login");
      return;
    }
    if (wishPending) return;
    setWishPending(true);
    try {
      if (wished) await deleteWishlist(product.id);
      else await addWishlist(product.id);
      setWished((current) => !current);
    } catch {
      window.alert("찜 상태를 변경하지 못했어요.");
    } finally {
      setWishPending(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: product.name, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        window.alert("상품 주소를 복사했어요.");
      }
    } catch {
      return;
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

  const reviewCount = reviews.length;
  const avgRatingNum =
    reviewCount > 0
      ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewCount
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
            <button type="button" aria-label="공유하기" onClick={handleShare}><Share2 size={22} /></button>
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

          <button type="button" className={styles.couponButton} onClick={() => navigate("/web/my/coupons")}>쿠폰 받기</button>

          <section className={styles.orderBenefits} aria-label="결제 및 적립 혜택">
            <button
              type="button"
              className={styles.benefitToggle}
              aria-expanded={benefitOpen}
              onClick={() => setBenefitOpen((open) => !open)}
            >
              <span><strong>{Math.round(salePrice * 0.85).toLocaleString()}원</strong> 결제할인가</span>
              <ChevronDown className={benefitOpen ? styles.chevronOpen : ""} size={20} />
            </button>
            <div className={`${styles.accordionBody} ${benefitOpen ? styles.accordionOpen : ""}`}>
              <div>
                <p>제휴카드 결제 시 최대 15% 할인</p>
                <span>카드사와 결제 조건에 따라 할인 금액이 달라질 수 있어요.</span>
              </div>
            </div>
          </section>

          <section className={styles.rewardCard} aria-label="적립 혜택">
            <button
              type="button"
              className={styles.benefitToggle}
              aria-expanded={cardOpen}
              onClick={() => setCardOpen((open) => !open)}
            >
              <span><strong>최대 {Math.round(salePrice * 0.05).toLocaleString()}원 적립</strong></span>
              <ChevronDown className={cardOpen ? styles.chevronOpen : ""} size={20} />
            </button>
            <div className={`${styles.accordionBody} ${cardOpen ? styles.accordionOpen : ""}`}>
              <div className={styles.rewardDetail}>
                <div><span>기본 구매 적립</span><strong>{Math.round(salePrice * 0.02).toLocaleString()}원</strong></div>
                <div><span>간편결제 추가 적립</span><strong>{Math.round(salePrice * 0.01).toLocaleString()}원</strong></div>
                <div className={styles.membershipReward}>
                  <CreditCard size={20} />
                  <span><strong>KOPANG 멤버십</strong> 가입 시 최대 5% 적립</span>
                </div>
              </div>
            </div>
          </section>

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
              <button type="button" className={styles.wish} aria-label={wished ? "찜 해제" : "찜하기"} aria-pressed={wished} disabled={wishPending} onClick={handleWish}><Heart size={22} fill={wished ? "currentColor" : "none"} /></button>
              <button type="button" className={styles.cart} onClick={handleAddToCart}>장바구니</button>
              <button type="button" className={styles.buy} onClick={handleDirectBuy}>바로구매</button>
            </div>
          </div>
        </div>
      </section>

      <nav id="web-detail-tabs" className={styles.tabs} aria-label="상품 상세 메뉴">
        <button type="button" className={activeTab === "product-info" ? styles.tabActive : ""} onClick={() => selectTab("product-info")}>상품정보</button>
        <button type="button" className={activeTab === "review" ? styles.tabActive : ""} onClick={() => selectTab("review")}>리뷰 {reviews.length}</button>
        <button type="button" className={activeTab === "qna" ? styles.tabActive : ""} onClick={() => selectTab("qna")}>문의 {productQna.length}</button>
        <button type="button" className={activeTab === "delivery" ? styles.tabActive : ""} onClick={() => selectTab("delivery")}>배송/환불</button>
      </nav>

      <div className={styles.detailWorkspace}>
        <div className={styles.tabContent}>
      <section id="product-info" className={styles.detailSection}>
        <header className={styles.detailIntro}>
          <p>KOPANG PRODUCT STORY</p>
          <h2>일상에 자연스럽게 스며드는<br />{product.name}</h2>
          {product.description ? (
            <div className={styles.descWrapper}>
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
          ) : (
            <span>필요한 기능과 편안한 사용 경험을 균형 있게 담은 상품입니다.</span>
          )}
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
        <header className={styles.contentTitle}><p className={styles.sectionLabel}>REVIEW</p><h2>상품 리뷰 <span>{reviews.length}</span></h2></header>
        {reviews.length === 0 ? <div className={styles.placeholder}><strong>아직 작성된 리뷰가 없어요.</strong><p>첫 번째 구매 후기를 남겨주세요.</p></div> : (
          <div className={styles.reviewList}>
            {reviews.map((review) => (
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
          <div><p className={styles.sectionLabel}>Q&amp;A</p><h2>상품 문의 <span>{productQna.length}</span></h2></div>
          <button type="button" onClick={() => navigate(`/web/qna/write?type=PRODUCT&productId=${product.id}`)}>상품 문의하기</button>
        </header>
        {productQna.length === 0 ? <div className={styles.placeholder}><strong>등록된 상품 문의가 없어요.</strong><p>상품에 대해 궁금한 점을 문의해 주세요.</p></div> : (
          <div className={styles.qnaList}>
            {productQna.map((item) => (
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
            <div className={styles.optionSelect}>기본 상품<span>단일 구성</span></div>
            <div className={styles.stickySelected}>
              <span>기본 상품</span>
              <div className={styles.quantity}>
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={16} /></button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => value + 1)}><Plus size={16} /></button>
              </div>
            </div>
            <div className={styles.couponRow}><span>받지 않은 쿠폰이 더 있어요</span><button type="button" onClick={() => navigate("/web/my/coupons")}>쿠폰 받기</button></div>
            <div className={styles.bundleRow}><PackageCheck size={20} /><span>다른 상품과 함께 장바구니에 담기</span></div>
          </div>
          <div className={styles.stickyBottom}>
            <div className={styles.stickyTotal}><span>주문금액</span><strong>{(salePrice * quantity).toLocaleString()}원</strong></div>
            <div className={styles.actions}>
              <button type="button" className={styles.wish} aria-label={wished ? "찜 해제" : "찜하기"} aria-pressed={wished} disabled={wishPending} onClick={handleWish}><Heart size={22} fill={wished ? "currentColor" : "none"} /></button>
              <button type="button" className={styles.cart} onClick={handleAddToCart}>장바구니</button>
              <button type="button" className={styles.buy} onClick={handleDirectBuy}>바로구매</button>
            </div>
          </div>
        </aside>
      </div>
    </WebLayout>
  );
}
