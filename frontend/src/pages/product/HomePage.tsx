import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Layout } from "../../components/Layout";
import { ProductCard } from "../../components/ProductCard";
import { useAuth } from "../../hooks/useAuth";
import { getCategories } from "../../api/categories";
import { getProducts } from "../../api/products";
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
  const [products, setProducts] = useState<Product[]>([]);
  const [bannerOpen, setBannerOpen] = useState(true); // 이탈위험①: 장바구니 방치 리마인더
  const [rebuyOpen, setRebuyOpen] = useState(true); // 이탈위험⑧: 재구매 주기 알림
  const [reco, setReco] = useState<RecommendationList | null>(null);
  const user = useAuth();

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("카테고리 불러오기 실패:", err));
    getProducts(undefined, 0, 20, undefined, "latest")
      .then((page) => setProducts(page.content))
      .catch((err) => console.error("상품 불러오기 실패:", err));
  }, []);

  useEffect(() => {
    if (user) {
      getRecommendations()
        .then(setReco)
        .catch((err) => console.error("추천 불러오기 실패:", err));
    } else {
      setReco(null);
    }
  }, [user]);

  // mock 8개를 순서만 돌려 섹션별로 다양하게 (실제론 각 섹션 전용 API)
  const rotate = (arr: Product[], n: number) => [...arr.slice(n), ...arr.slice(0, n)];
  const sections = [
    { title: "🔥 지금 뜨는 상품", items: products },
    { title: "⚡ 오늘의 특가", items: rotate(products, 3) },
    { title: "🆕 신상품", items: rotate(products, 5) },
  ];

  return (
    <Layout>
      {/* 이탈방지① 장바구니 방치 리마인더 (목업: 항상 노출, 실제론 백엔드가 방치 감지 시) */}
      {bannerOpen && (
        <Link to="/cart" className={styles.abandonBanner}>
          <span className={styles.abandonText}>
            🛒 장바구니에 담아둔 상품이 기다려요 · 지금 구매 시 <b>5% 추가할인</b>
          </span>
          <button
            type="button"
            className={styles.abandonClose}
            aria-label="닫기"
            onClick={(e) => {
              e.preventDefault();
              setBannerOpen(false);
            }}
          >
            <X size={16} />
          </button>
        </Link>
      )}

      {/* 이탈방지⑧ 재구매 주기 알림 (목업: 항상 노출, 실제론 구매주기 도달 감지 시) */}
      {rebuyOpen && (
        <Link to="/products/2" className={`${styles.abandonBanner} ${styles.rebuyBanner}`}>
          <span className={styles.abandonText}>
            🔁 자주 사시던 <b>제주 삼다수</b> 다시 살 때가 됐어요 · 지금 재주문
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

      {/* 히어로 배너 (캐러셀 자리) */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.heroTitle}>쿨링 진정 인기템</p>
          <p className={styles.heroSub}>오늘의 코팡 특가 🎉</p>
        </div>
        <span className={styles.heroPager}>1 / 5</span>
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

      {/* 멤버십 전환 유도(업셀) — 일반 고객 대상. 실제론 비회원에게만 노출 */}
      <Link to="/membership" className={styles.upsell}>
        <div>
          <p className={styles.upsellTitle}>⭐ WOW 멤버십 무료배송 + 2% 적립</p>
          <p className={styles.upsellSub}>첫 달 무료로 혜택 받아보기</p>
        </div>
        <span className={styles.upsellArrow}>→</span>
      </Link>

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
