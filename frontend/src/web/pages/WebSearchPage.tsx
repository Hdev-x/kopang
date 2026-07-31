import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, searchProductsAI } from "../../api/products";
import type { Product } from "../../types/product";
import { WebLayout } from "../components/WebLayout";
import { WebProductCard } from "../components/WebProductCard";
import styles from "./WebSearchPage.module.css";

export function WebSearchPage() {
  const [params] = useSearchParams();
  const keyword = params.get("q")?.trim() ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(Boolean(keyword));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  const observerTarget = useRef<HTMLDivElement>(null);

  // 검색어 초기 변경 시 첫 페이지 데이터 로드
  useEffect(() => {
    if (!keyword) {
      setProducts([]);
      setPage(0);
      setHasMore(false);
      setTotalElements(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setPage(0);

    searchProductsAI(keyword, 0, 20)
      .then((res) => {
        const newProducts = res.content || [];
        setProducts(newProducts);
        setTotalElements(res.totalElements || newProducts.length);
        const isLast = res.last ?? ((res.number + 1) >= res.totalPages || newProducts.length === 0);
        setHasMore(!isLast);
        setError(false);
      })
      .catch(() => {
        // Fallback to standard product search
        getProducts(undefined, 0, 20, keyword, "popular")
          .then((res) => {
            const newProducts = res.content || [];
            setProducts(newProducts);
            setTotalElements(res.totalElements || newProducts.length);
            const isLast = res.last ?? ((res.number + 1) >= res.totalPages || newProducts.length === 0);
            setHasMore(!isLast);
            setError(false);
          })
          .catch(() => setError(true));
      })
      .finally(() => setLoading(false));
  }, [keyword]);

  // 무한 스크롤 IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading || loadingMore || !keyword) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadingMore(true);
          const nextPage = page + 1;

          searchProductsAI(keyword, nextPage, 20)
            .then((res) => {
              const newItems = res.content || [];
              setProducts((prev) => {
                const existingIds = new Set(prev.map((p) => p.id));
                const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
              });
              setPage(nextPage);
              const isLast = res.last ?? ((res.number + 1) >= res.totalPages || newItems.length === 0);
              setHasMore(!isLast);
            })
            .catch(() => {
              getProducts(undefined, nextPage, 20, keyword, "popular")
                .then((res) => {
                  const newItems = res.content || [];
                  setProducts((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                  });
                  setPage(nextPage);
                  const isLast = res.last ?? ((res.number + 1) >= res.totalPages || newItems.length === 0);
                  setHasMore(!isLast);
                })
                .catch(() => setHasMore(false));
            })
            .finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loading, loadingMore, page, keyword]);

  return (
    <WebLayout>
      {keyword ? (
        <section className={styles.results}>
          <header>
            <div>
              <p>SEARCH RESULT</p>
              <h2>‘{keyword}’ 검색 결과</h2>
            </div>
            <strong>{totalElements.toLocaleString()}개</strong>
          </header>
          {loading ? (
            <div className={styles.status}>상품을 검색하고 있어요.</div>
          ) : error ? (
            <div className={styles.status}>검색 결과를 불러오지 못했어요.</div>
          ) : products.length === 0 ? (
            <div className={styles.status}>일치하는 상품이 없어요. 상단 검색창에서 다른 검색어를 입력해 보세요.</div>
          ) : (
            <>
              <div className={styles.grid}>
                {products.map((product) => (
                  <WebProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* 무한 스크롤 트리거 영역 */}
              <div ref={observerTarget} className={styles.scrollTarget}>
                {loadingMore && <div className={styles.loadingMore}>상품을 더 불러오고 있어요...</div>}
              </div>
            </>
          )}
        </section>
      ) : (
        <div className={styles.status}>
          상단 검색창에서 원하시는 상품이나 브랜드를 검색해 보세요.
        </div>
      )}
    </WebLayout>
  );
}

