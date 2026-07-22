import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategories } from "../../api/categories";
import { getProducts } from "../../api/products";
import type { Category } from "../../types/category";
import type { Product } from "../../types/product";
import { WebLayout } from "../components/WebLayout";
import { WebProductCard } from "../components/WebProductCard";
import styles from "./WebProductListPage.module.css";

const SORT_OPTIONS = [
  { value: "popular", label: "인기순" },
  { value: "latest", label: "최신순" },
  { value: "priceAsc", label: "낮은 가격순" },
  { value: "priceDesc", label: "높은 가격순" },
];

export function WebProductListPage() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const categoryId = Number(params.get("cat")) || undefined;
  const sort = params.get("sort") ?? "popular";

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    getProducts(categoryId, 0, 40, undefined, sort)
      .then((page) => {
        setProducts(page.content);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [categoryId, sort]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  const updateParam = (key: "cat" | "sort", value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  return (
    <WebLayout>
      <div className={styles.breadcrumb}>쇼핑홈 / 카테고리 / {activeCategory?.name ?? "전체 상품"}</div>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h2>카테고리</h2>
          <button className={!categoryId ? styles.active : ""} onClick={() => updateParam("cat")}>전체 상품</button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={category.id === categoryId ? styles.active : ""}
              onClick={() => updateParam("cat", String(category.id))}
            >
              {category.name}
            </button>
          ))}
        </aside>

        <section className={styles.content}>
          <header className={styles.contentHeader}>
            <div>
              <p className={styles.eyebrow}>CATEGORY</p>
              <h1>{activeCategory?.name ?? "전체 상품"}</h1>
            </div>
            <select value={sort} onChange={(event) => updateParam("sort", event.target.value)} aria-label="상품 정렬">
              {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </header>

          <div className={styles.filterBar}>
            <button className={styles.filterActive}>전체</button>
            <button>무료배송</button>
            <button>할인상품</button>
            <button>재고 있음</button>
          </div>

          {loading ? (
            <div className={styles.status}>상품을 불러오는 중이에요.</div>
          ) : error ? (
            <div className={styles.status}>상품을 불러오지 못했어요.</div>
          ) : products.length === 0 ? (
            <div className={styles.status}>조건에 맞는 상품이 없어요.</div>
          ) : (
            <div className={styles.productGrid}>
              {products.map((product) => <WebProductCard key={product.id} product={product} />)}
            </div>
          )}
        </section>
      </div>
    </WebLayout>
  );
}
