import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";
import { Layout } from "../../components/Layout";
import { ProductCard } from "../../components/ProductCard";
import { getProducts } from "../../api/products";
import type { Product } from "../../types/product";
import styles from "./SearchPage.module.css";

// 자동완성용 인기 키워드 (목업)
const KEYWORDS = [
  "운동화", "에어팟", "반팔티", "원피스", "냉장고", "비타민", "강아지 사료",
  "캠핑", "청소기", "향수", "노트북", "커피머신", "립스틱", "축구공", "장난감",
];
const RECENT_KEY = "kopang_recent";

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function SearchPage() {
  // 검색어는 헤더 검색바와 공유되는 URL ?q= 가 단일 소스
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (q) {
      getProducts(undefined, 0, 40, q)
        .then((p) => setResults(p.content))
        .catch(console.error);
    }
  }, [q]);

  // 추천어/최근검색어 클릭 → 검색어 확정 + 최근검색어 저장
  const pick = (k: string) => {
    const next = [k, ...recent.filter((r) => r !== k)].slice(0, 8);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setSearchParams({ q: k }, { replace: true });
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem(RECENT_KEY);
  };

  const suggestions = q ? KEYWORDS.filter((kw) => kw.includes(q) && kw !== q).slice(0, 6) : [];

  // 검색어 없음 → 최근 검색어
  if (!q) {
    return (
      <Layout>
        <div className={styles.recentHead}>
          <span>최근 검색어</span>
          {recent.length > 0 && (
            <button type="button" className={styles.clearAll} onClick={clearRecent}>
              전체삭제
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className={styles.empty}>최근 검색어가 없어요</p>
        ) : (
          <div className={styles.chips}>
            {recent.map((r) => (
              <button key={r} type="button" className={styles.chip} onClick={() => pick(r)}>
                <Clock size={14} /> {r}
              </button>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  // 검색어 있음 → 자동완성 추천 + 결과
  return (
    <Layout>
      {suggestions.length > 0 && (
        <div className={styles.suggestRow}>
          {suggestions.map((s) => (
            <button key={s} type="button" className={styles.suggestChip} onClick={() => pick(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <p className={styles.resultHead}>
        <b>{q}</b> 검색 결과
      </p>
      <div className={styles.grid}>
        {results.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Layout>
  );
}
