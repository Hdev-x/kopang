import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";
import { Layout } from "../../components/Layout";
import { ProductCard } from "../../components/ProductCard";
import { getSearchHistory, addSearchHistory, deleteSearchHistory, clearSearchHistory, searchProductsAI } from "../../api/products";
import { useAuth } from "../../hooks/useAuth";
import type { Product } from "../../types/product";
import styles from "./SearchPage.module.css";

// 자동완성용 인기 키워드 (목업)
const KEYWORDS = [
  "운동화", "에어팟", "반팔티", "원피스", "냉장고", "비타민", "강아지 사료",
  "캠핑", "청소기", "향수", "노트북", "커피머신", "립스틱", "축구공", "장난감",
];
const RECENT_KEY = "kopang_recent";

interface RecentItem {
  id: string | number;
  keyword: string;
}

function loadRecent(): RecentItem[] {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return list.map((k) => ({ id: k, keyword: k }));
  } catch {
    return [];
  }
}

export function SearchPage() {
  const user = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const [prevQ, setPrevQ] = useState("");
  if (q !== prevQ) {
    setPrevQ(q);
    setCurrentPage(0);
    setResults([]);
    setTotalPages(1);
  }

  const fetchRecent = () => {
    if (user) {
      getSearchHistory()
        .then((data) => {
          setRecent(data.map((h) => ({ id: h.searchId, keyword: h.keyword })));
        })
        .catch(console.error);
    } else {
      setRecent(loadRecent());
    }
  };

  useEffect(() => {
    fetchRecent();
  }, [user]);

  useEffect(() => {
    if (q) {
      setLoading(true);
      searchProductsAI(q, currentPage, 20)
        .then((page) => {
          if (currentPage === 0) {
            setResults(page.content || []);
          } else {
            setResults((prev) => [...prev, ...(page.content || [])]);
          }
          setTotalPages(page.totalPages || 1);
        })
        .catch(console.error)
        .finally(() => setLoading(false));

      if (currentPage === 0) {
        if (user) {
          addSearchHistory(q)
            .then(() => fetchRecent())
            .catch(console.error);
        } else {
          const localList = loadRecent().map((r) => r.keyword);
          const next = [q, ...localList.filter((r) => r !== q)].slice(0, 8);
          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
          setRecent(next.map((k) => ({ id: k, keyword: k })));
        }
      }
    }
  }, [q, user, currentPage]);

  useEffect(() => {
    if (loading || currentPage >= totalPages - 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loading, currentPage, totalPages]);

  const pick = (k: string) => {
    setSearchParams({ q: k }, { replace: true });
  };

  const deleteItem = (e: React.MouseEvent, item: RecentItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      deleteSearchHistory(Number(item.id))
        .then(() => fetchRecent())
        .catch(console.error);
    } else {
      const localList = loadRecent().map((r) => r.keyword);
      const next = localList.filter((k) => k !== item.keyword);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecent(next.map((k) => ({ id: k, keyword: k })));
    }
  };

  const clearRecent = () => {
    if (user) {
      clearSearchHistory()
        .then(() => setRecent([]))
        .catch(console.error);
    } else {
      setRecent([]);
      localStorage.removeItem(RECENT_KEY);
    }
  };

  const suggestions = q ? KEYWORDS.filter((kw) => kw.includes(q) && kw !== q).slice(0, 6) : [];

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
              <div key={r.id} className={styles.chip}>
                <button type="button" className={styles.chipText} onClick={() => pick(r.keyword)}>
                  <Clock size={14} /> {r.keyword}
                </button>
                <button type="button" className={styles.chipDelete} onClick={(e) => deleteItem(e, r)} aria-label="삭제">
                  &times;
                </button>
              </div>
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
      {loading && currentPage === 0 ? (
        <p className={styles.empty}>불러오는 중...</p>
      ) : !loading && results.length === 0 ? (
        <p className={styles.empty}>검색 결과가 없습니다.</p>
      ) : (
        <div className={styles.grid}>
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* 무한 스크롤 스크롤 트리거 */}
      {totalPages > 1 && currentPage < totalPages - 1 && (
        <div ref={observerRef} style={{ textAlign: "center", padding: "30px 0", color: "var(--color-text-muted)" }}>
          {loading ? "불러오는 중..." : "스크롤하여 더 보기"}
        </div>
      )}
    </Layout>
  );
}
