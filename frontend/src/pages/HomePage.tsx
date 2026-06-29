import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ProductCard } from "../components/ProductCard";
import { getCategories } from "../api/categories";
import { getProducts } from "../api/products";
import type { Category } from "../types/category";
import type { Product } from "../types/product";
import styles from "./HomePage.module.css";

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("카테고리 불러오기 실패:", err));
    getProducts()
      .then((page) => setProducts(page.content))
      .catch((err) => console.error("상품 불러오기 실패:", err));
  }, []);

  // mock 8개를 순서만 돌려 섹션별로 다양하게 (실제론 각 섹션 전용 API)
  const rotate = (arr: Product[], n: number) => [...arr.slice(n), ...arr.slice(0, n)];
  const sections = [
    { title: "🔥 지금 뜨는 상품", items: products },
    { title: "⚡ 오늘의 특가", items: rotate(products, 3) },
    { title: "🆕 신상품", items: rotate(products, 5) },
  ];

  return (
    <Layout>
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
            to={`/products?category=${encodeURIComponent(c.name)}`}
            className={styles.chip}
          >
            <span className={styles.chipEmoji}>{c.emoji}</span>
            <span className={styles.chipName}>{c.name}</span>
          </Link>
        ))}
      </div>

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
