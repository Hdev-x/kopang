import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Skeleton } from "../../../components/Skeleton";
import { getProducts, deleteProduct } from "../../../api/products";
import { getCategories } from "../../../api/categories";
import type { Product } from "../../../types/product";
import type { Category } from "../../../types/category";
import styles from "../adminTable.module.css";

/*
 * 상품 관리는 "보면서 관리"하는 화면이다. 썸네일이 필요하지만 실제 작업은
 * 재고·가격 확인이라, 카드 그리드(한 화면 6~8개) 대신 썸네일이 붙은 표를 쓴다.
 * 이미지를 크게 봐야 할 때는 수정 화면으로 들어간다.
 */

// 재고 임계값 — 품절임박 기준. 바꾸려면 여기만 고치면 된다.
const LOW_STOCK = 20;

type StockFilter = "전체" | "판매중" | "품절임박" | "품절";
const STOCK_FILTERS: StockFilter[] = ["전체", "판매중", "품절임박", "품절"];

function stockState(stock?: number): Exclude<StockFilter, "전체"> {
  const s = stock ?? 0;
  if (s === 0) return "품절";
  if (s <= LOW_STOCK) return "품절임박";
  return "판매중";
}

function stockTone(state: string) {
  if (state === "품절") return styles.bRisk;
  if (state === "품절임박") return styles.bWait;
  return styles.bDone;
}

export function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatName, setSelectedCatName] = useState("전체");
  const [tempKeyword, setTempKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("전체");

  useEffect(() => {
    getCategories().then(setCategories).catch((e) => console.error("카테고리 조회 실패", e));
  }, []);

  useEffect(() => {
    const targetCat = categories.find((c) => c.name === selectedCatName);
    const categoryId = selectedCatName === "전체" ? undefined : targetCat?.id;
    setProducts(null);
    getProducts(categoryId, 0, 1000, keyword, "latest")
      .then((data) => setProducts(data?.content ?? []))
      .catch((e) => { console.error("상품 목록 조회 실패", e); setProducts([]); });
  }, [selectedCatName, categories, keyword]);

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`'${name}' 상품을 삭제할까요?`)) return;
    deleteProduct(id)
      .then(() => setProducts((prev) => prev?.filter((p) => p.id !== id) ?? prev))
      .catch((err) => alert(err.response?.data?.message || "상품 삭제에 실패했습니다."));
  };

  // 카테고리 트리에서 이름 경로를 찾는다 (대분류 > 소분류)
  const findCategoryPath = (catList: Category[], catId?: number): Category[] => {
    if (!catId) return [];
    for (const c of catList) {
      if (c.id === catId) return [c];
      if (c.children?.length) {
        const sub = findCategoryPath(c.children, catId);
        if (sub.length) return [c, ...sub];
      }
    }
    return [];
  };

  const counts = useMemo(() => {
    const base: Record<string, number> = { 전체: products?.length ?? 0, 판매중: 0, 품절임박: 0, 품절: 0 };
    for (const p of products ?? []) base[stockState(p.stock)] += 1;
    return base;
  }, [products]);

  const shown = useMemo(() => {
    if (!products) return [];
    if (stockFilter === "전체") return products;
    return products.filter((p) => stockState(p.stock) === stockFilter);
  }, [products, stockFilter]);

  const loading = products === null;
  const filterCategories = ["전체", ...categories.map((c) => c.name)];

  return (
    <AdminLayout title="상품 관리" fullBleed>
      <div className={styles.page}>
        {/* 1줄: 카테고리 — 개수가 많아 따로 둔다 */}
        <div className={styles.toolbar}>
          <div className={styles.chips}>
            {filterCategories.map((name) => (
              <button
                key={name}
                type="button"
                className={`${styles.chip} ${selectedCatName === name ? styles.chipOn : ""}`}
                onClick={() => setSelectedCatName(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* 2줄: 재고 상태 + 검색 + 등록 */}
        <div className={styles.toolbar}>
          <div className={styles.chips}>
            {STOCK_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.chip} ${stockFilter === f ? styles.chipOn : ""}`}
                onClick={() => setStockFilter(f)}
              >
                {f}<b>{loading ? "\u00a0" : counts[f]?.toLocaleString() ?? 0}</b>
              </button>
            ))}
          </div>
          <span className={styles.spacer} />
          <label className={styles.search}>
            <Search size={15} />
            <input
              value={tempKeyword}
              onChange={(e) => setTempKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setKeyword(tempKeyword); }}
              placeholder="상품명 검색 (Enter)"
            />
          </label>
          <Link to="/admin/products/new" className={styles.btnPrimary}>
            <Plus size={15} /> 상품 등록
          </Link>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th style={{ width: 64 }} />
                <th>상품명</th>
                <th style={{ width: 180 }}>카테고리</th>
                <th style={{ width: 120 }} className={styles.r}>가격</th>
                <th style={{ width: 90 }} className={styles.r}>재고</th>
                <th style={{ width: 100 }}>상태</th>
                <th style={{ width: 130 }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* 썸네일이 있는 표라 행 높이가 44px 다. 일반 스켈레톤 행(13px)을 쓰면
                   데이터가 올 때 행마다 30px 씩 늘어나 구분선이 통째로 밀린다. */
                Array.from({ length: 10 }, (_, i) => (
                  <tr key={i}>
                    <td><Skeleton w={44} h={44} r={8} /></td>
                    <td><Skeleton w="74%" h={13} /></td>
                    <td><Skeleton w="60%" h={13} /></td>
                    <td><Skeleton w="56%" h={13} /></td>
                    <td><Skeleton w="40%" h={13} /></td>
                    <td><Skeleton w="50%" h={13} /></td>
                    <td><Skeleton w="60%" h={13} /></td>
                  </tr>
                ))
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    {(products?.length ?? 0) === 0 ? "등록된 상품이 없습니다." : "조건에 맞는 상품이 없습니다."}
                  </td>
                </tr>
              ) : (
                shown.map((p) => {
                  const state = stockState(p.stock);
                  const path = findCategoryPath(categories, p.categoryId);
                  return (
                    <tr key={p.id} className={styles.rowLink} onClick={() => navigate(`/admin/products/edit/${p.id}`)}>
                      <td>
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt="" className={styles.thumb} />
                          : <span className={styles.thumbEmpty}>없음</span>}
                      </td>
                      {/* 이동은 링크로 — 행 onClick 만 두면 키보드·스크린리더로 접근할 수 없다 */}
                      <td className={styles.name}>
                        <Link to={`/admin/products/edit/${p.id}`} className={styles.cellLink} onClick={(e) => e.stopPropagation()}>
                          <span className={styles.ellip}>{p.name}</span>
                        </Link>
                      </td>
                      <td className={styles.num}>{path.length ? path.map((c) => c.name).join(" › ") : "미분류"}</td>
                      <td className={styles.r}>{p.price.toLocaleString()}원</td>
                      <td className={styles.r}>{(p.stock ?? 0).toLocaleString()}</td>
                      <td><span className={`${styles.badge} ${stockTone(state)}`}>{state}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className={styles.rowActions}>
                          <Link to={`/admin/products/edit/${p.id}`} className={`${styles.btnGhost} ${styles.btnSmall}`}>수정</Link>
                          <button
                            type="button"
                            className={`${styles.btnGhost} ${styles.btnSmall}`}
                            onClick={() => handleDelete(p.id, p.name)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
