import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Layout } from "../../components/Layout";
import { ProductCard } from "../../components/ProductCard";
import { useAuth } from "../../hooks/useAuth";
import { getCategories } from "../../api/categories";
import { getProducts } from "../../api/products";
import { getMembershipStatus } from "../../api/membership";
import { getHomeBanners } from "../../api/homeBanners";
import type { HomeBanners } from "../../api/homeBanners";
import { downloadCoupon } from "../../api/coupon";
import { getCart } from "../../api/cart";
import { CATEGORY_EMOJIS } from "../../types/category";
import type { Category } from "../../types/category";
import type { Product } from "../../types/product";
import { getRecommendations, markRecommendationShown, markRecommendationClicked } from "../../api/recommendations";
import type { RecommendationList, RecommendedProduct } from "../../api/recommendations";
import styles from "./HomePage.module.css";

function RecommendedProductCard({ item }: { item: RecommendedProduct }) {
  useEffect(() => {
    markRecommendationShown(item.recommendId).catch(console.error);
  }, [item.recommendId]);

  const mappedProduct: Product = {
    id: item.productId,
    name: item.name,
    price: item.price,
    imageUrl: item.imageUrl || "",
    categoryId: item.categoryId,
    discountRate: item.discountPrice && item.price ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : undefined,
  };

  const handleClick = () => {
    markRecommendationClicked(item.recommendId).catch(console.error);
  };

  return <ProductCard product={mappedProduct} onClick={handleClick} />;
}

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [bannerOpen, setBannerOpen] = useState(true); // 이탈위험①: 장바구니 방치 리마인더
  const [rebuyOpen, setRebuyOpen] = useState(true); // 이탈위험⑧: 재구매 주기 알림
  const [banners, setBanners] = useState<HomeBanners | null>(null);
  const [reco, setReco] = useState<RecommendationList | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const user = useAuth();

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("카테고리 불러오기 실패:", err));

    getProducts(undefined, 0, 12, undefined, "popular")
      .then((page) => setPopularProducts(page.content))
      .catch((err) => console.error("인기 상품 불러오기 실패:", err));

    getProducts(undefined, 0, 12, undefined, "discount")
      .then((page) => setDealProducts(page.content))
      .catch((err) => console.error("특가 상품 불러오기 실패:", err));

    getProducts(undefined, 0, 12, undefined, "latest")
      .then((page) => setLatestProducts(page.content))
      .catch((err) => console.error("신상품 불러오기 실패:", err));
  }, []);

  useEffect(() => {
    if (user) {
      getRecommendations()
        .then(setReco)
        .catch((err) => console.error("추천 불러오기 실패:", err));

      getMembershipStatus()
        .then((statusData) => {
          if (statusData && (statusData.status === "ACTIVE" || statusData.status === "CANCELLED")) {
            setIsMember(true);
          } else {
            setIsMember(false);
          }
        })
        .catch((err) => {
          console.error("멤버십 상태 조회 실패:", err);
          setIsMember(false);
        });

      getHomeBanners()
        .then(setBanners)
        .catch(console.error);

      getCart()
        .then((items) => setCartCount(items ? items.length : 0))
        .catch(() => setCartCount(0));
    } else {
      setReco(null);
      setIsMember(false);
      setBanners(null);
      setCartCount(0);
    }
  }, [user]);

  const handleAbandonBannerClick = () => {
    // 5% 장바구니 방치 할인 쿠폰(couponId=3) 발급 시도 (중복 발급 시 백엔드 오류는 에러 표시 없이 차단)
    downloadCoupon(3).catch(() => { });
  };

  // 히어로 슬라이드 구조 (고정 3개 + 개인화 2개)
  const latestTop = latestProducts[0];
  const popularTop = popularProducts[0];
  const dealTop = dealProducts[0];

  type HeroSlide = {
    id: string;
    tag: string;
    title: string;
    subtitle: string;
    link: string;
    imageUrl?: string;
    badge?: string;
    bgGradient: string;
  };

  const heroSlides: HeroSlide[] = [
    {
      id: "latest",
      tag: "🆕 NEW ARRIVAL",
      title: latestTop?.name || "새로 들어온 신상 컬렉션",
      subtitle: latestTop ? `${latestTop.price.toLocaleString()}원 · 지금 바로 확인하기` : "Kopang 따끈따끈 신상품 둘러보기",
      link: latestTop ? `/products/${latestTop.id}` : "/products?sort=latest",
      imageUrl: latestTop?.imageUrl,
      bgGradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    },
    {
      id: "popular",
      tag: "🔥 BEST SELLER",
      title: popularTop?.name || "지금 가장 인기 있는 아이템",
      subtitle: popularTop ? `${popularTop.price.toLocaleString()}원 · 랭킹 1위 상품` : "실시간 베스트 상품순위",
      link: popularTop ? `/products/${popularTop.id}` : "/products?sort=popular",
      imageUrl: popularTop?.imageUrl,
      bgGradient: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)",
    },
    {
      id: "deal",
      tag: "⚡ SPECIAL DEAL",
      title: dealTop?.name || "오늘의 파격 특가 세일",
      subtitle: dealTop?.discountRate ? `최대 ${dealTop.discountRate}% 할인 혜택 중!` : "오늘의 코팡 특가 세일",
      link: dealTop ? `/products/${dealTop.id}` : "/products?sort=discount",
      imageUrl: dealTop?.imageUrl,
      badge: dealTop?.discountRate ? `${dealTop.discountRate}% OFF` : "HOT DEAL",
      bgGradient: "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
    },
  ];

  // 개인화 4: WOW 멤버십 미가입자 혜택 안내
  if (!isMember) {
    heroSlides.push({
      id: "membership",
      tag: "⭐ WOW MEMBERSHIP",
      title: "WOW 멤버십 무제한 무료배송",
      subtitle: "구매금액 5% 추가 적립 및 다양한 회원 혜택 받기",
      link: "/membership",
      bgGradient: "linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)",
    });
  }

  // 개인화 5: 장바구니에 상품이 담겨있을 때 안내
  if (user && cartCount > 0) {
    heroSlides.push({
      id: "cart",
      tag: "🛒 CART REMINDER",
      title: `장바구니에 ${cartCount}개 상품이 기다려요`,
      subtitle: "담아둔 상품들을 지금 바로 확인해보세요",
      link: "/cart",
      bgGradient: "linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)",
    });
  }

  // 히어로 자동 슬라이더 타이머 (4초)
  useEffect(() => {
    if (isHeroHovered || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isHeroHovered, heroSlides.length]);

  const activeIndex = heroIndex % heroSlides.length;
  const currentSlide = heroSlides[activeIndex] || heroSlides[0];

  const sections = [
    { title: "🔥 지금 뜨는 상품", items: popularProducts },
    { title: "⚡ 오늘의 특가", items: dealProducts },
    { title: "🆕 신상품", items: latestProducts },
  ];

  return (
    <Layout>
      {/* 이탈방지① 장바구니 방치 리마인더 */}
      {user && bannerOpen && banners?.cartAbandon && (
        <Link to="/cart" className={styles.abandonBanner} onClick={handleAbandonBannerClick}>
          <span className={styles.abandonText}>
            🛒 장바구니에 담아둔 상품이 기다려요 · 지금 구매 시 <b>5% 추가할인</b>
          </span>
          <button
            type="button"
            className={styles.abandonClose}
            aria-label="닫기"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setBannerOpen(false);
            }}
          >
            <X size={16} />
          </button>
        </Link>
      )}

      {/* 이탈방지⑧ 재구매 주기 알림 */}
      {user && rebuyOpen && banners?.rebuy && (
        <Link to={`/products/${banners.rebuy.productId}`} className={`${styles.abandonBanner} ${styles.rebuyBanner}`}>
          <span className={styles.abandonText}>
            🔁 자주 사시던 <b>{banners.rebuy.productName}</b> 다시 살 때가 됐어요 · 지금 재주문
          </span>
          <button
            type="button"
            className={styles.abandonClose}
            aria-label="닫기"
            onClick={(e) => {
              e.preventDefault();
              setRebuyOpen(false);
            }}
          >
            <X size={16} />
          </button>
        </Link>
      )}

      {/* 히어로 배너 캐러셀 (고정 3개 + 개인화 2개) */}
      <section
        className={styles.hero}
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
        style={{ background: currentSlide.bgGradient }}
      >
        <Link to={currentSlide.link} className={styles.heroLink}>
          {currentSlide.imageUrl && (
            <img src={currentSlide.imageUrl} alt={currentSlide.title} className={styles.heroBgImage} />
          )}
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <div className={styles.heroTagRow}>
              <span className={styles.heroTag}>{currentSlide.tag}</span>
              {currentSlide.badge && <span className={styles.heroBadge}>{currentSlide.badge}</span>}
            </div>
            <h2 className={styles.heroTitle}>{currentSlide.title}</h2>
            <p className={styles.heroSub}>{currentSlide.subtitle}</p>
          </div>
        </Link>

        {heroSlides.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.heroNav} ${styles.heroNavLeft}`}
              aria-label="이전 배너"
              onClick={(e) => {
                e.preventDefault();
                setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={`${styles.heroNav} ${styles.heroNavRight}`}
              aria-label="다음 배너"
              onClick={(e) => {
                e.preventDefault();
                setHeroIndex((prev) => (prev + 1) % heroSlides.length);
              }}
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <span className={styles.heroPager}>
          {activeIndex + 1} / {heroSlides.length}
        </span>
      </section>

      {/* 카테고리 — 한 줄 가로 스크롤 */}
      <div className={styles.categoryRow}>
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/products?cat=${c.id}`}
            className={styles.chip}
          >
            <span className={styles.chipEmoji}>{CATEGORY_EMOJIS[c.name] ?? "📁"}</span>
            <span className={styles.chipName}>{c.name}</span>
          </Link>
        ))}
      </div>

      {/* 멤버십 전환 유도(업셀) — 비멤버십 회원에게만 노출 */}
      {!isMember && (
        <Link to="/membership" className={styles.upsell}>
          <div>
            <p className={styles.upsellTitle}>⭐ WOW 멤버십 무료배송 + 5% 적립</p>
            <p className={styles.upsellSub}>첫 달 무료로 혜택 받아보기</p>
          </div>
          <span className={styles.upsellArrow}>→</span>
        </Link>
      )}

      {/* 맞춤 추천 (추천 ML: item-CF 결과 자리. 콜드스타트는 인기상품으로 대체) */}
      {reco && reco.items.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>🎯 {reco.title}</h2>
            <span className={styles.recoNote}>최근 본·구매 기반</span>
          </div>
          <div className={styles.hrow}>
            {reco.items.slice(0, 6).map((item) => (
              <RecommendedProductCard key={`reco-${item.recommendId}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* 상품 큐레이션 섹션들 (각 2열 그리드) */}
      {sections.map((s) => (
        <section key={s.title} className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{s.title}</h2>
            <Link to="/products" className={styles.more}>
              더보기
            </Link>
          </div>
          {/* 각 줄이 독립적으로 가로 스크롤 */}
          <div className={styles.hrow}>
            {s.items.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className={styles.hrow}>
            {s.items.slice(6, 12).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </Layout>
  );
}
