import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Gift, Heart, House, Image, PackageCheck, ShoppingBag, Sparkles, Truck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { getCategories } from "../../api/categories";
import { getProducts } from "../../api/products";
import { CATEGORY_EMOJIS, type Category } from "../../types/category";
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

export function WebHomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [latest, setLatest] = useState<Product[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getProducts(undefined, 0, 20, undefined, "popular"), getProducts(undefined, 0, 10, undefined, "latest")])
      .then(([categoryData, popularPage, latestPage]) => { setCategories(categoryData); setPopular(popularPage.content); setLatest(latestPage.content); setError(false); })
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const heroProducts = popular.slice(0, 4);
  const hero = heroProducts[heroIndex] ?? popular[0];
  const deals = useMemo(() => popular.filter((product) => Boolean(product.discountRate)).slice(0, 5), [popular]);
  const recommended = popular.slice(5, 10);

  const moveHero = (direction: number) => {
    if (heroProducts.length === 0) return;
    setHeroIndex((current) => (current + direction + heroProducts.length) % heroProducts.length);
  };

  return <WebLayout>
    <section className={styles.hero}>
      <Link to={hero ? `/web/products/${hero.id}` : "/web/products"} className={styles.heroMain}>
        {hero?.imageUrl ? <img src={hero.imageUrl} alt={hero.name} /> : <ProductImageFallback featured />}
        <div className={styles.heroOverlay}><span>오늘의 추천</span><h1>{hero?.name ?? "생활을 바꾸는 상품을 만나보세요"}</h1><p>{hero?.brand ?? "Kopang 큐레이션"}</p></div>
      </Link>
      <Link to={popular[1] ? `/web/products/${popular[1].id}` : "/web/products"} className={styles.heroSide}>
        {popular[1]?.imageUrl ? <img src={popular[1].imageUrl} alt={popular[1].name} /> : <ProductImageFallback />}
        <div><strong>이번 주 인기 상품</strong><span>{popular[1]?.name ?? "인기 상품을 확인해 보세요"}</span></div>
      </Link>
      <div className={styles.heroControl}><button type="button" onClick={() => moveHero(-1)} aria-label="이전 배너"><ChevronLeft size={18} /></button><span>{heroProducts.length ? heroIndex + 1 : 0} / {heroProducts.length}</span><button type="button" onClick={() => moveHero(1)} aria-label="다음 배너"><ChevronRight size={18} /></button></div>
    </section>

    <nav className={styles.shortcuts} aria-label="홈 바로가기">{SHORTCUTS.map(({ label, to, icon: Icon }) => <Link key={label} to={to}><span><Icon size={28} /></span><strong>{label}</strong></Link>)}</nav>

    <HomeSection title="카테고리별 상품 찾기" to="/web/products">
      {loading
        ? <div className={styles.categoryGrid} aria-label="카테고리를 불러오는 중">{Array.from({ length: 10 }, (_, index) => <div key={index} className={styles.categorySkeleton} />)}</div>
        : error
          ? <div className={styles.status}>카테고리를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
          : categories.length === 0
            ? <div className={styles.status}>등록된 카테고리가 없어요.</div>
            : <div className={styles.categoryGrid}>{categories.slice(0, 10).map((category) => <Link key={category.id} to={`/web/products?cat=${category.id}`}><span aria-hidden="true">{getCategoryIcon(category)}</span><strong>{category.name}</strong></Link>)}</div>}
    </HomeSection>

    <HomeSection title="오늘의 특가" subtitle="할인 중인 상품을 놓치지 마세요" to="/web/products?sort=popular">
      <ProductContent loading={loading} error={error} products={deals.length ? deals : popular.slice(0, 5)} />
    </HomeSection>

    <section className={styles.promotion}><div><p>KOPANG MEMBERSHIP</p><h2>쇼핑할수록 커지는 멤버십 혜택</h2><span>추가 적립과 배송 혜택을 한 번에 확인하세요.</span><Link to="/web/membership">혜택 확인하기 <ChevronRight size={17} /></Link></div><Gift size={92} /></section>

    <HomeSection title="지금 많이 찾는 상품" subtitle="사용자들이 많이 살펴본 인기 상품이에요" to="/web/products?sort=popular">
      <ProductContent loading={loading} error={error} products={recommended.length ? recommended : popular.slice(0, 5)} />
    </HomeSection>

    <HomeSection title="생활을 바꾸는 쇼핑 테마" subtitle="상품을 용도별로 묶어 빠르게 둘러보세요">
      {popular.length === 0
        ? <div className={styles.status}>추천 테마를 준비하고 있어요.</div>
        : <div className={styles.themeGrid}>{popular.slice(0, 4).map((product, index) => <Link key={product.id} to={`/web/products/${product.id}`}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <ProductImageFallback />}<div><span>THEME {String(index + 1).padStart(2, "0")}</span><h3>{["편안한 하루를 위한 선택", "공간을 단정하게 만드는 방법", "매일 쓰기 좋은 생활 아이템", "선물하기 좋은 인기 상품"][index]}</h3></div></Link>)}</div>}
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
  if (loading) return <div className={styles.productGrid} aria-label="상품을 불러오는 중">{Array.from({ length: 5 }, (_, index) => <div key={index} className={styles.productSkeleton}><div /><span /><span /></div>)}</div>;
  if (error) return <div className={styles.status}>상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>;
  if (products.length === 0) return <div className={styles.status}>표시할 상품이 없어요.</div>;
  return <div className={styles.productGrid}>{products.map((product) => <WebProductCard key={product.id} product={product} />)}</div>;
}

function getCategoryIcon(category: Category) {
  return category.emoji || CATEGORY_EMOJIS[category.name] || "🛍️";
}

function ProductImageFallback({ featured = false }: { featured?: boolean }) {
  return <div className={`${styles.imagePlaceholder} ${featured ? styles.imagePlaceholderFeatured : ""}`} aria-hidden="true"><Image size={featured ? 56 : 40} /><span>KOPANG</span></div>;
}
