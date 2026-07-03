import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ProductCard } from "../components/ProductCard";
import { getCategories } from "../api/categories";
import { getProducts } from "../api/products";
import type { Category } from "../types/category";
import type { Product } from "../types/product";
import styles from "./ProductListPage.module.css";

export function ProductListPage() {
  const [params, setParams] = useSearchParams();
  const [tree, setTree] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // 선택 상태: 대분류는 URL(?cat=), 중/소는 화면 내 상태
  const majorId = Number(params.get("cat")) || null;
  const [midId, setMidId] = useState<number | null>(null);
  const [subId, setSubId] = useState<number | null>(null);
  const [sort, setSort] = useState("popular");

  // 카테고리 트리 1회 로드
  useEffect(() => {
    getCategories()
      .then(setTree)
      .catch((e) => console.error("카테고리 로드 실패:", e));
  }, []);

  // 선택된 대분류 (URL 없으면 첫 번째)
  const major = useMemo(
    () => tree.find((c) => c.id === majorId) ?? tree[0],
    [tree, majorId],
  );

  // 대분류가 바뀌면 중/소 초기화
  useEffect(() => {
    setMidId(null);
    setSubId(null);
  }, [major?.id]);

  // 현재 대분류 기준으로 유효한 중/소만 인정 (전환 중 깜빡임 방지)
  const mids = major?.children ?? [];
  const midValid = mids.some((m) => m.id === midId) ? midId : null;
  const mid = mids.find((m) => m.id === midValid) ?? null;
  const subs = mid?.children ?? [];
  const subValid = subs.some((s) => s.id === subId) ? subId : null;

  // 가장 구체적인 선택 = 소 ?? 중 ?? 대
  const activeId = subValid ?? midValid ?? major?.id ?? null;

  useEffect(() => {
    if (activeId == null) return;
    setLoading(true);
    getProducts(activeId)
      .then((page) => setProducts(page.content))
      .catch((e) => console.error("상품 로드 실패:", e))
      .finally(() => setLoading(false));
  }, [activeId]);

  // 정렬 (인기순=기본 순서 유지)
  const sorted = [...products];
  if (sort === "priceAsc") sorted.sort((a, b) => a.price - b.price);
  else if (sort === "priceDesc") sorted.sort((a, b) => b.price - a.price);
  else if (sort === "latest") sorted.sort((a, b) => b.id - a.id);

  return (
    <Layout>
      {/* 대분류 가로 스크롤 */}
      <div className={styles.majorRow}>
        {tree.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.majorChip} ${c.id === major?.id ? styles.majorActive : ""}`}
            onClick={() => setParams({ cat: String(c.id) })}
          >
            <span className={styles.majorEmoji}>{c.emoji}</span>
            <span className={styles.majorName}>{c.name}</span>
          </button>
        ))}
      </div>

      {/* 대분류 타이틀 */}
      <h1 className={styles.title}>{major?.name ?? "전체 상품"}</h1>

      {/* 중분류 필터 */}
      {mids.length > 0 && (
        <div className={styles.filterRow}>
          <button
            type="button"
            className={`${styles.filter} ${midValid == null ? styles.filterActive : ""}`}
            onClick={() => {
              setMidId(null);
              setSubId(null);
            }}
          >
            전체
          </button>
          {mids.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`${styles.filter} ${m.id === midValid ? styles.filterActive : ""}`}
              onClick={() => {
                setMidId(m.id);
                setSubId(null);
              }}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* 소분류 필터 — 중분류를 고르고 그 아래 소분류가 있을 때만 (A 방식) */}
      {mid && subs.length > 0 && (
        <div className={`${styles.filterRow} ${styles.subRow}`}>
          <button
            type="button"
            className={`${styles.filter} ${styles.subFilter} ${subValid == null ? styles.filterActive : ""}`}
            onClick={() => setSubId(null)}
          >
            전체
          </button>
          {subs.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`${styles.filter} ${styles.subFilter} ${s.id === subValid ? styles.filterActive : ""}`}
              onClick={() => setSubId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* 정렬 바 */}
      <div className={styles.sortBar}>
        <span className={styles.count}>{products.length}개</span>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="popular">인기순</option>
          <option value="priceAsc">낮은 가격순</option>
          <option value="priceDesc">높은 가격순</option>
          <option value="latest">최신순</option>
        </select>
      </div>

      {/* 상품 그리드 */}
      {loading ? (
        <p className={styles.empty}>불러오는 중...</p>
      ) : sorted.length === 0 ? (
        <p className={styles.empty}>상품이 없습니다.</p>
      ) : (
        <div className={styles.grid}>
          {sorted.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}
