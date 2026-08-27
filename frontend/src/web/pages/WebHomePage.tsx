import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Gift, Heart, House, Image as ImageIcon, PackageCheck, ShoppingBag, Sparkles, Truck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { getCategories } from "../../api/categories";
import { getProducts } from "../../api/products";
import { getMembershipStatus } from "../../api/membership";
import { getCart } from "../../api/cart";
import { useAuth } from "../../hooks/useAuth";
import { Skeleton, SkeletonThumb } from "../../components/Skeleton";
import type { Category } from "../../types/category";
import type { Product } from "../../types/product";
import { WebLayout } from "../components/WebLayout";
import { WebProductCard } from "../components/WebProductCard";
import styles from "./WebHomePage.module.css";

const SHORTCUTS = [
  { label: "쇼핑하기", to: "/web/products", icon: ShoppingBag },
  { label: "오늘의 특가", to: "/web/products?sort=popular", icon: Zap },
  { label: "추천 상품", to: "/web/products?sort=recommended", icon: Sparkles },
  { label: "멤버십", to: "/web/membership", icon: Gift },
  { label: "찜한 상품", to: "/web/my/wishlist", icon: Heart },
  { label: "주문 내역", to: "/web/my/orders", icon: PackageCheck },
  { label: "배송 확인", to: "/web/my/orders", icon: Truck },
  { label: "고객센터", to: "/web/support", icon: House },
];

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  "식품": "🍎",
  "생활용품": "🧴",
  "가전/디지털": "📱",
  "패션": "👕",
  "뷰티": "💄",
  "스포츠": "⚽",
  "완구/취미": "🎮",
  "반려동물": "🐶",
  "자동차": "🚗",
  "출산/유아동": "🍼",
  "인테리어": "🛋️",
  "주방용품": "🍳",
};

function getCategoryEmoji(category: Category) {
  if (category.emoji && category.emoji !== "□") return category.emoji;
  return CATEGORY_EMOJI_MAP[category.name] ?? "🛍️";
}

export type WebHeroSlide = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  link: string;
  imageUrl?: string;
  badge?: string;
  bgGradient?: string;
};

export function WebHomePage() {
  const user = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [latest, setLatest] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // 왼쪽 헤드라인 메인 슬라이더 전용 상태
  const [mainHeroIndex, setMainHeroIndex] = useState(0);
  const [isMainHovered, setIsMainHovered] = useState(false);

  // 오른쪽 '이번 주 인기 상품' 전용 슬라이더 전용 상태
  const [sideHeroIndex, setSideHeroIndex] = useState(0);
  const [isSideHovered, setIsSideHovered] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      getCategories(),
      getProducts(undefined, 0, 20, undefined, "popular"),
      getProducts(undefined, 0, 10, undefined, "latest"),
      getProducts(undefined, 0, 10, undefined, "discount"),
    ])
      .then(([categoryData, popularPage, latestPage, dealPage]) => {
        setCategories(categoryData);
        setPopular(popularPage.content);
        setLatest(latestPage.content);
        setDeals(dealPage.content);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      getMembershipStatus()
        .then((statusData) => {
          if (statusData && (statusData.status === "ACTIVE" || statusData.status === "CANCELLED")) {
            setIsMember(true);
          } else {
            setIsMember(false);
          }
        })
        .catch(() => setIsMember(false));

      getCart()
        .then((items) => setCartCount(items ? items.length : 0))
        .catch(() => setCartCount(0));
    } else {
      setIsMember(false);
      setCartCount(0);
    }
  }, [user]);

  // 왼쪽 메인 히어로 슬라이드 목록 (5종)
  // 1. 신상품 2. 인기상품 3. 특가 상품 4. 멤버십 가입 (개인화) 5. 장바구니 방치 (개인화)
  const latestTop = latest[0];
  const popularTop = popular[0];
  const dealTop = deals[0] ?? popular.find((p) => Boolean(p.discountRate));

  const mainHeroSlides: WebHeroSlide[] = [
    {
      id: "latest",
      tag: "🆕 NEW ARRIVAL · 신상품",
      title: latestTop?.name || "새로 들어온 신상 컬렉션",
      subtitle: latestTop ? `${latestTop.price.toLocaleString()}원 · 지금 바로 확인하기` : "Kopang 따끈따끈 신상품 둘러보기",
      link: latestTop ? `/web/products/${latestTop.id}` : "/web/products?sort=latest",
      imageUrl: latestTop?.imageUrl,
      bgGradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    },
    {
      id: "popular",
      tag: "🔥 BEST SELLER · 인기상품",
      title: popularTop?.name || "지금 가장 인기 있는 아이템",
      subtitle: popularTop ? `${popularTop.price.toLocaleString()}원 · 랭킹 1위 상품` : "실시간 베스트 상품순위",
      link: popularTop ? `/web/products/${popularTop.id}` : "/web/products?sort=popular",
      imageUrl: popularTop?.imageUrl,
      bgGradient: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)",
    },
    {
      id: "deal",
      tag: "⚡ SPECIAL DEAL · 특가 상품",
      title: dealTop?.name || "오늘의 파격 특가 세일",
      subtitle: dealTop?.discountRate ? `최대 ${dealTop.discountRate}% 할인 혜택 중!` : "오늘의 코팡 특가 세일",
      link: dealTop ? `/web/products/${dealTop.id}` : "/web/products?sort=popular",
      imageUrl: dealTop?.imageUrl,
      badge: dealTop?.discountRate ? `${dealTop.discountRate}% OFF` : "HOT DEAL",
      bgGradient: "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
    },
  ];

  // 4. 멤버십 가입 (개인화: 미가입자 대상 - 단색/그라데이션 디자인 사용)
  if (!isMember) {
    mainHeroSlides.push({
      id: "membership",
      tag: "⭐ WOW MEMBERSHIP · 멤버십 혜택",
      title: "WOW 멤버십 무제한 무료배송",
      subtitle: "구매금액 5% 추가 적립 및 배송비 0원 혜택 받기",
      link: "/web/membership",
      bgGradient: "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)",
    });
  }

  // 5. 장바구니 방치 (개인화: 장바구니에 상품 존재 시 - 단색/그라데이션 디자인 사용)
  if (user && cartCount > 0) {
    mainHeroSlides.push({
      id: "cart",
      tag: "🛒 CART REMINDER · 장바구니 리마인더",
      title: `장바구니에 ${cartCount}개 상품이 기다려요`,
      subtitle: "담아둔 상품들을 지금 바로 확인해보세요",
      link: "/web/cart",
      bgGradient: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
    });
  }

  // 왼쪽 메인 배너 자동 슬라이더 (4초)
  useEffect(() => {
    if (isMainHovered || mainHeroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setMainHeroIndex((prev) => (prev + 1) % mainHeroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isMainHovered, mainHeroSlides.length]);

  const activeMainIndex = mainHeroIndex % mainHeroSlides.length;
  const currentMainHero = mainHeroSlides[activeMainIndex] || mainHeroSlides[0];

  const moveMainHero = (direction: number) => {
    if (mainHeroSlides.length === 0) return;
    setMainHeroIndex((current) => (current + direction + mainHeroSlides.length) % mainHeroSlides.length);
  };

  // 오른쪽 '이번 주 인기 상품' 전용 슬라이더 (상위 5개 상품)
  const sidePopularList = useMemo(() => popular.slice(0, 5), [popular]);

  // 오른쪽 배너 자동 슬라이더 (5초)
  useEffect(() => {
    if (isSideHovered || sidePopularList.length <= 1) return;
    const timer = setInterval(() => {
      setSideHeroIndex((prev) => (prev + 1) % sidePopularList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isSideHovered, sidePopularList.length]);

  const activeSideIndex = sideHeroIndex % (sidePopularList.length || 1);
  const currentSideProduct = sidePopularList[activeSideIndex] || popular[0];

  const moveSideHero = (direction: number) => {
    if (sidePopularList.length === 0) return;
    setSideHeroIndex((current) => (current + direction + sidePopularList.length) % sidePopularList.length);
  };

  const lifestyleThemes = useMemo(() => {
    const themeDefs = [
      {
        id: "interior",
        categoryTag: "홈 & 인테리어",
        targetNames: ["인테리어", "가전/디지털", "생활용품"],
        title: "공간을 채우는 감성 인테리어 & 가전",
        fallbackImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80",
      },
      {
        id: "food",
        categoryTag: "푸드 & 간편식",
        targetNames: ["식품"],
        title: "오늘 뭐 먹지? 맛있는 간편 푸드",
        fallbackImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
      },
      {
        id: "fashion",
        categoryTag: "패션 & 뷰티",
        targetNames: ["패션", "뷰티"],
        title: "매일 부담 없이 입는 데일리 라이프",
        fallbackImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80",
      },
      {
        id: "pet",
        categoryTag: "반려동물 & 펫케어",
        targetNames: ["반려동물"],
        title: "우리 집 댕냥이를 위한 펫 잇템",
        fallbackImage: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80",
      },
    ];

    return themeDefs.map((def) => {
      const matchingCat = categories.find((c) => def.targetNames.includes(c.name));
      const catId = matchingCat?.id;
      const matchingProduct = catId ? popular.find((p) => p.categoryId === catId) : undefined;
      const imageUrl = matchingProduct?.imageUrl || def.fallbackImage;
      const to = catId ? `/web/products?cat=${catId}` : "/web/products";

      return {
        id: def.id,
        categoryTag: def.categoryTag,
        title: def.title,
        imageUrl,
        to,
      };
    });
  }, [categories, popular]);

  const dealDisplayList = useMemo(() => (deals.length ? deals.slice(0, 5) : popular.slice(0, 5)), [deals, popular]);

  return <WebLayout>
    <section className={styles.hero}>
      {/* ===== 1. 왼쪽 메인 히어로 슬라이더 ===== */}
      <div
        className={styles.heroMainWrapper}
        onMouseEnter={() => setIsMainHovered(true)}
        onMouseLeave={() => setIsMainHovered(false)}
      >
        <Link
          to={currentMainHero.link}
          className={styles.heroMain}
        >
          {currentMainHero.imageUrl ? (
            <>
              <img src={currentMainHero.imageUrl} alt={currentMainHero.title} />
              <div className={styles.heroMainOverlay}>
                <div className={styles.heroTagRow}>
                  <span className={styles.heroTag}>{currentMainHero.tag}</span>
                  {currentMainHero.badge && <span className={styles.heroBadge}>{currentMainHero.badge}</span>}
                </div>
                <h1>{currentMainHero.title}</h1>
                <p>{currentMainHero.subtitle}</p>
              </div>
            </>
          ) : (
            <div
              className={styles.heroCustomBg}
              style={{ background: currentMainHero.bgGradient || "linear-gradient(135deg, #1d4ed8, #6d28d9)" }}
            >
              <div className={styles.heroTagRow}>
                <span className={styles.heroTag}>{currentMainHero.tag}</span>
              </div>
              <h1>{currentMainHero.title}</h1>
              <p>{currentMainHero.subtitle}</p>
            </div>
          )}
        </Link>
        {mainHeroSlides.length > 1 && (
          <div className={styles.heroControlMain}>
            <button type="button" onClick={() => moveMainHero(-1)} aria-label="이전 메인 배너"><ChevronLeft size={16} /></button>
            <span>{activeMainIndex + 1} / {mainHeroSlides.length}</span>
            <button type="button" onClick={() => moveMainHero(1)} aria-label="다음 메인 배너"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {/* ===== 2. 오른쪽 이번 주 인기 상품 전용 독립 슬라이더 ===== */}
      <div
        className={styles.heroSideWrapper}
        onMouseEnter={() => setIsSideHovered(true)}
        onMouseLeave={() => setIsSideHovered(false)}
      >
        <Link
          to={currentSideProduct ? `/web/products/${currentSideProduct.id}` : "/web/products"}
          className={styles.heroSide}
        >
          {currentSideProduct?.imageUrl ? (
            <img src={currentSideProduct.imageUrl} alt={currentSideProduct.name} />
          ) : (
            <ProductImageFallback />
          )}
          <div className={styles.heroSideOverlay}>
            <span className={styles.heroSideTag}>🔥 이번 주 인기 상품 RANK {activeSideIndex + 1}</span>
            <strong className={styles.heroSideTitle}>{currentSideProduct?.name ?? "인기 상품을 확인해 보세요"}</strong>
            <span className={styles.heroSideSub}>
              {currentSideProduct ? `${currentSideProduct.price.toLocaleString()}원` : ""}
            </span>
          </div>
        </Link>
        {sidePopularList.length > 1 && (
          <div className={styles.heroControlSide}>
            <button type="button" onClick={() => moveSideHero(-1)} aria-label="이전 인기 상품"><ChevronLeft size={14} /></button>
            <span>{activeSideIndex + 1} / {sidePopularList.length}</span>
            <button type="button" onClick={() => moveSideHero(1)} aria-label="다음 인기 상품"><ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </section>

    <nav className={styles.shortcuts} aria-label="홈 바로가기">{SHORTCUTS.map(({ label, to, icon: Icon }) => <Link key={label} to={to}><span><Icon size={28} /></span><strong>{label}</strong></Link>)}</nav>

    <HomeSection title="카테고리별 상품 찾기" to="/web/products">
      {loading
        ? <div className={styles.categoryGrid} aria-label="카테고리를 불러오는 중">{Array.from({ length: 10 }, (_, index) => <div key={index} className={styles.categorySkeleton} />)}</div>
        : error
          ? <div className={styles.status}>카테고리를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
          : categories.length === 0
            ? <div className={styles.status}>등록된 카테고리가 없어요.</div>
            : <div className={styles.categoryGrid}>{categories.slice(0, 10).map((category) => <Link key={category.id} to={`/web/products?cat=${category.id}`}><span aria-hidden="true">{getCategoryEmoji(category)}</span><strong>{category.name}</strong></Link>)}</div>}
    </HomeSection>

    <HomeSection title="오늘의 특가" subtitle="할인 중인 상품을 놓치지 마세요" to="/web/products?sort=popular">
      <ProductContent loading={loading} error={error} products={dealDisplayList} />
    </HomeSection>

    {!isMember && (
      <section className={styles.promotion}><div><p>KOPANG MEMBERSHIP</p><h2>쇼핑할수록 커지는 멤버십 혜택</h2><span>추가 적립과 배송 혜택을 한 번에 확인하세요.</span><Link to="/web/membership">혜택 확인하기 <ChevronRight size={17} /></Link></div><Gift size={92} /></section>
    )}

    <HomeSection title="베스트 상품" subtitle="Kopang에서 가장 많이 선택받은 베스트 아이템이에요" to="/web/products?sort=popular">
      <ProductContent loading={loading} error={error} products={popular.slice(0, 5)} />
    </HomeSection>

    <HomeSection title="생활을 바꾸는 쇼핑 테마" subtitle="원하는 추천 라이프스타일 테마를 클릭해 빠르게 둘러보세요">
      <div className={styles.themeGrid}>
        {lifestyleThemes.map((theme, index) => (
          <Link key={theme.id} to={theme.to}>
            {theme.imageUrl ? <img src={theme.imageUrl} alt={theme.title} /> : <ProductImageFallback />}
            <div>
              <span>THEME {String(index + 1).padStart(2, "0")} · {theme.categoryTag}</span>
              <h3>{theme.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </HomeSection>

    <HomeSection title="새로 들어온 상품" subtitle="Kopang의 새로운 상품을 먼저 만나보세요" to="/web/products?sort=latest">
      <ProductContent loading={loading} error={error} products={latest.slice(0, 5)} />
    </HomeSection>
  </WebLayout>;
}

function HomeSection({ title, subtitle, to, children }: { title: string; subtitle?: string; to?: string; children: ReactNode }) {
  return <section className={styles.section}><header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{to && <Link to={to}>더보기 <ChevronRight size={17} /></Link>}</header>{children}</section>;
}

function ProductContent({ loading, error, products }: { loading: boolean; error: boolean; products: Product[] }) {
  if (loading) return <div className={styles.productGrid} aria-label="상품을 불러오는 중">{Array.from({ length: 5 }, (_, index) => <div key={index} className={styles.productSkeleton}><SkeletonThumb /><Skeleton w="86%" /><Skeleton w="55%" /></div>)}</div>;
  if (error) return <div className={styles.status}>상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>;
  if (products.length === 0) return <div className={styles.status}>표시할 상품이 없어요.</div>;
  return <div className={styles.productGrid}>{products.map((product) => <WebProductCard key={product.id} product={product} />)}</div>;
}

/** 이미지가 없는 상품 자리. 빈 회색 사각형 대신 브랜드 표식을 보여준다. */
function ProductImageFallback({ featured = false }: { featured?: boolean }) {
  return <div className={`${styles.imagePlaceholder} ${featured ? styles.imagePlaceholderFeatured : ""}`} aria-hidden="true"><ImageIcon size={featured ? 56 : 40} /><span>KOPANG</span></div>;
}
