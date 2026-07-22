import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCategories } from "../../api/categories";
import { getProducts } from "../../api/products";
import type { Category } from "../../types/category";
import type { Product } from "../../types/product";
import { WebLayout } from "../components/WebLayout";
import { WebProductCard } from "../components/WebProductCard";
import styles from "./WebHomePage.module.css";

export function WebHomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getProducts(undefined, 0, 12, undefined, "popular")])
      .then(([categoryData, productPage]) => {
        setCategories(categoryData);
        setProducts(productPage.content);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WebLayout>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>오늘의 Kopang</p>
          <h1>생활을 바꾸는 상품을<br />한곳에서 만나보세요</h1>
          <p className={styles.heroText}>웹 홈의 배너·문구·이미지는 레퍼런스를 보며 조정할 예정입니다.</p>
          <Link to="/web/products">상품 둘러보기 <ArrowRight size={18} /></Link>
        </div>
        <div className={styles.heroVisual} aria-label="메인 프로모션 이미지 영역">
          <span>MAIN VISUAL</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.sectionEyebrow}>CATEGORY</p>
            <h2>카테고리로 찾기</h2>
          </div>
          <Link to="/web/products">전체보기 <ArrowRight size={17} /></Link>
        </div>
        <div className={styles.categoryGrid}>
          {categories.slice(0, 8).map((category) => (
            <Link key={category.id} to={`/web/products?cat=${category.id}`}>
              <span>{category.emoji ?? "□"}</span>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.sectionEyebrow}>POPULAR</p>
            <h2>지금 인기 있는 상품</h2>
          </div>
          <Link to="/web/products?sort=popular">더보기 <ArrowRight size={17} /></Link>
        </div>

        {loading ? (
          <div className={styles.status}>상품을 불러오는 중이에요.</div>
        ) : error ? (
          <div className={styles.status}>상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
        ) : products.length === 0 ? (
          <div className={styles.status}>표시할 상품이 없어요.</div>
        ) : (
          <div className={styles.productGrid}>
            {products.slice(0, 8).map((product) => <WebProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </WebLayout>
  );
}
