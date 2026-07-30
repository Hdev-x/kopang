import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { getCategories } from "../../api/categories";
import { getProducts } from "../../api/products";
import type { Category } from "../../types/category";
import type { Product } from "../../types/product";
import { WebLayout } from "../components/WebLayout";
import { WebProductCard } from "../components/WebProductCard";
import styles from "./WebProductListPage.module.css";

const SORT_OPTIONS = [{ value: "popular", label: "인기순" }, { value: "latest", label: "최신순" }, { value: "priceAsc", label: "낮은 가격순" }, { value: "priceDesc", label: "높은 가격순" }];

export function WebProductListPage() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editorialIndex, setEditorialIndex] = useState(0);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null | "auto">("auto");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const categoryId = Number(params.get("cat")) || undefined;
  const sort = params.get("sort") ?? "popular";
  const view = params.get("view");

  useEffect(() => { getCategories().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => { getProducts(categoryId, 0, 40, undefined, sort).then((page) => { setProducts(page.content); setError(false); }).catch(() => setError(true)).finally(() => setLoading(false)); }, [categoryId, sort]);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const activeCategory = flatCategories.find((category) => category.id === categoryId);
  const categoryPath = useMemo(() => buildCategoryPath(flatCategories, categoryId), [flatCategories, categoryId]);
  const pageTitle = view === "deal" ? "오늘의딜" : view === "only" ? "단독상품" : activeCategory?.name ?? "전체 카테고리";
  const deals = products.filter((product) => Boolean(product.discountRate)).slice(0, 6);
  const editorialProducts = products.length > 0 ? Array.from({ length: Math.min(3, products.length) }, (_, offset) => products[(editorialIndex + offset) % products.length]) : [];

  const updateParam = (key: "cat" | "sort", value?: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next); };
  const moveEditorial = (direction: number) => { if (products.length > 0) setEditorialIndex((current) => (current + direction + products.length) % products.length); };

  return <WebLayout><div className={styles.pageLayout}>
    <aside className={styles.sidebar}><h1>{pageTitle}</h1><Link to="/web/products" className={!categoryId ? styles.active : ""}>전체 상품</Link>{categories.map((category) => <CategoryBranch key={category.id} category={category} activeId={categoryId} expanded={expandedCategoryId === category.id || (expandedCategoryId === "auto" && containsCategory(category.children ?? [], categoryId))} onToggle={() => setExpandedCategoryId((current) => current === category.id ? null : category.id)} />)}</aside>
    <main className={styles.content}>
      <nav className={styles.breadcrumb} aria-label="카테고리 경로"><Link to="/web/products">전체</Link>{categoryPath.map((category) => <span key={category.id}><ChevronRight size={14} /><Link to={`/web/products?cat=${category.id}`} aria-current={category.id === categoryId ? "page" : undefined}>{category.name}</Link></span>)}</nav>
      <section className={styles.editorial}><header><h2>{pageTitle}</h2><span>상품과 브랜드를 새로운 테마로 만나보세요.</span></header><div className={styles.editorialGrid}>{editorialProducts.map((product, index) => <Link key={`${product.id}-${index}`} to={`/web/products/${product.id}`}><img src={product.imageUrl} alt="" /><div><span>CURATION {index + 1}</span><h3>{["디테일로 완성하는 일상", "나에게 꼭 맞는 상품", "쉽게 시작하는 새로운 선택"][index]}</h3><p>{product.name}</p></div></Link>)}</div><div className={styles.carouselButtons}><button type="button" onClick={() => moveEditorial(-1)} aria-label="이전 기획전"><ChevronLeft /></button><button type="button" onClick={() => moveEditorial(1)} aria-label="다음 기획전"><ChevronRight /></button></div></section>

      <section className={styles.dealSection}><header><div><h2>#지금은 할인 중</h2><p>현재 할인율이 적용된 상품이에요.</p></div><Link to="/web/products?view=deal">더보기 <ChevronRight size={17} /></Link></header>{deals.length > 0 ? <div className={styles.dealGrid}>{deals.map((product) => <WebProductCard key={product.id} product={product} />)}</div> : <div className={styles.status}>현재 표시할 할인 상품이 없어요.</div>}</section>

      <section className={styles.allProducts}><header><div><h2>{pageTitle} 상품</h2><p>총 {products.length}개 상품</p></div><select value={sort} onChange={(event) => updateParam("sort", event.target.value)} aria-label="상품 정렬">{SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></header><div className={styles.filters}><button type="button"><SlidersHorizontal size={16} />필터</button><button type="button">무료배송</button><button type="button">할인상품</button><button type="button">재고 있음</button></div>
        {loading ? <div className={styles.status}>상품을 불러오는 중이에요.</div> : error ? <div className={styles.status}>상품을 불러오지 못했어요.</div> : products.length === 0 ? <div className={styles.status}>조건에 맞는 상품이 없어요.</div> : <div className={styles.productGrid}>{products.map((product) => <WebProductCard key={product.id} product={product} />)}</div>}
      </section>
    </main>
  </div></WebLayout>;
}

function CategoryBranch({ category, activeId, expanded, onToggle }: { category: Category; activeId?: number; expanded: boolean; onToggle: () => void }) {
  const hasChildren = Boolean(category.children?.length);

  return <div className={styles.categoryBranch}>{hasChildren ? <Link to={`/web/products?cat=${category.id}`} className={`${styles.categoryRow} ${category.id === activeId ? styles.active : ""}`} onClick={onToggle} aria-expanded={expanded}><span>{category.name}</span><ChevronDown className={expanded ? styles.expandedIcon : ""} size={15} /></Link> : <Link to={`/web/products?cat=${category.id}`} className={`${styles.categoryRow} ${category.id === activeId ? styles.active : ""}`}>{category.name}</Link>}{hasChildren && <div className={`${styles.categoryChildren} ${expanded ? styles.categoryChildrenOpen : ""}`} aria-hidden={!expanded}>{category.children?.slice(0, 8).map((child) => <Link key={child.id} to={`/web/products?cat=${child.id}`} tabIndex={expanded ? 0 : -1} className={child.id === activeId ? styles.active : ""}>{child.name}</Link>)}</div>}</div>;
}

function flattenCategories(categories: Category[]): Category[] { return categories.flatMap((category) => [category, ...flattenCategories(category.children ?? [])]); }

function containsCategory(categories: Category[], activeId?: number): boolean { return Boolean(activeId && categories.some((category) => category.id === activeId || containsCategory(category.children ?? [], activeId))); }

function buildCategoryPath(categories: Category[], activeId?: number): Category[] {
  if (!activeId) return [];
  const path: Category[] = [];
  let current = categories.find((category) => category.id === activeId);
  while (current) {
    path.unshift(current);
    current = current.parentId == null ? undefined : categories.find((category) => category.id === current?.parentId);
  }
  return path;
}
