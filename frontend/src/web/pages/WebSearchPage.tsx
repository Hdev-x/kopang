import { FormEvent, useEffect, useState } from "react";
import { Clock3, Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { addSearchHistory, getProducts, getSearchHistory, type SearchHistory } from "../../api/products";
import type { Product } from "../../types/product";
import { WebLayout } from "../components/WebLayout";
import { WebProductCard } from "../components/WebProductCard";
import styles from "./WebSearchPage.module.css";

export function WebSearchPage() {
  const [params, setParams] = useSearchParams();
  const keyword = params.get("q")?.trim() ?? "";
  const [input, setInput] = useState(keyword);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(Boolean(keyword));
  const [error, setError] = useState(false);

  useEffect(() => {
    getSearchHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    if (!keyword) return;

    getProducts(undefined, 0, 40, keyword, "popular")
      .then((page) => {
        setProducts(page.content);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [keyword]);

  const search = (value: string) => {
    const nextKeyword = value.trim();
    if (!nextKeyword) return;
    setInput(nextKeyword);
    setLoading(true);
    setParams({ q: nextKeyword });
    addSearchHistory(nextKeyword).catch(() => undefined);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    search(input);
  };

  return (
    <WebLayout>
      <section className={styles.hero}>
        <p>SEARCH</p>
        <h1>어떤 상품을 찾고 있나요?</h1>
        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <Search size={22} aria-hidden="true" />
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="상품명이나 브랜드를 입력하세요" autoFocus />
          {input && <button type="button" aria-label="검색어 지우기" onClick={() => setInput("")}><X size={18} /></button>}
          <button type="submit">검색</button>
        </form>
      </section>

      {!keyword && (
        <section className={styles.recent}>
          <div className={styles.sectionTitle}><Clock3 size={20} /><h2>최근 검색어</h2></div>
          {history.length > 0 ? (
            <div className={styles.keywordList}>
              {history.slice(0, 10).map((item) => <button type="button" key={item.searchId} onClick={() => search(item.keyword)}>{item.keyword}</button>)}
            </div>
          ) : <p className={styles.emptyText}>최근 검색한 상품이 없어요.</p>}
        </section>
      )}

      {keyword && (
        <section className={styles.results}>
          <header><div><p>SEARCH RESULT</p><h2>‘{keyword}’ 검색 결과</h2></div><strong>{products.length}개</strong></header>
          {loading ? <div className={styles.status}>상품을 검색하고 있어요.</div>
            : error ? <div className={styles.status}>검색 결과를 불러오지 못했어요.</div>
              : products.length === 0 ? <div className={styles.status}>일치하는 상품이 없어요. 다른 검색어를 입력해 보세요.</div>
                : <div className={styles.grid}>{products.map((product) => <WebProductCard key={product.id} product={product} />)}</div>}
        </section>
      )}
    </WebLayout>
  );
}
