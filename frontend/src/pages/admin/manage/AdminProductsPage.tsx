import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { getProducts, deleteProduct } from "../../../api/products";
import { getCategories } from "../../../api/categories";
import type { Product } from "../../../types/product";
import type { Category } from "../../../types/category";
import sh from "../adminShared.module.css";
import styles from "./AdminProductsPage.module.css";

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatName, setSelectedCatName] = useState("전체");
  const [tempKeyword, setTempKeyword] = useState("");
  const [keyword, setKeyword] = useState("");

  // 1. 카테고리 목록 로드
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("카테고리 조회 실패:", err));
  }, []);

  // 2. 선택된 카테고리에 따른 상품 목록 로드
  useEffect(() => {
    // 선택된 카테고리 명칭과 매핑되는 categoryId를 탐색
    const targetCat = categories.find((c) => c.name === selectedCatName);
    const categoryId = selectedCatName === "전체" ? undefined : targetCat?.id;

    // 백엔드는 페이징을 지원하므로 page=0, size=1000으로 설정하고, 최신순(latest) 정렬을 주어 로딩 속도를 최적화합니다.
    getProducts(categoryId, 0, 1000, keyword, "latest")
      .then((data) => {
        if (data && data.content) {
          setProducts(data.content);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => console.error("상품 목록 조회 실패:", err));
  }, [selectedCatName, categories, keyword]);

  // 상품 삭제 처리
  const handleDelete = (id: number) => {
    if (!window.confirm("정말로 이 상품을 삭제하시겠습니까?")) return;

    deleteProduct(id)
      .then(() => {
        alert("상품이 성공적으로 삭제되었습니다.");
        setProducts((prev) => prev.filter((p) => p.id !== id));
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || "상품 삭제에 실패했습니다.";
        alert(errMsg);
      });
  };

  // 재고 수에 따라 동적으로 상태 명칭 및 스타일 배지 계산
  const getProductStatus = (stock?: number) => {
    const s = stock ?? 0;
    if (s === 0) return { label: "품절", style: sh.bDanger };
    if (s <= 20) return { label: "품절임박", style: sh.bWarn };
    return { label: "판매중", style: sh.bOk };
  };

  // 탭 필터 메뉴는 "전체" + 1차 depth 루트 카테고리 이름들
  const filterCategories = ["전체", ...categories.map((c) => c.name)];

  // 카테고리 트리 계층(대분류/소분류)에서 categoryId 경로 재귀 탐색
  const findCategoryPath = (catList: Category[], catId?: number): Category[] => {
    if (!catId) return [];
    for (const c of catList) {
      if (c.id === catId) return [c];
      if (c.children && c.children.length > 0) {
        const subPath = findCategoryPath(c.children, catId);
        if (subPath.length > 0) return [c, ...subPath];
      }
    }
    return [];
  };

  return (
    <AdminLayout title="상품 관리">
      <div className={sh.toolbar}>
        <div className={sh.filters}>
          {filterCategories.map((cName) => (
            <button
              key={cName}
              className={`${sh.chip} ${selectedCatName === cName ? sh.chipActive : ""}`}
              onClick={() => setSelectedCatName(cName)}
            >
              {cName}
            </button>
          ))}
        </div>

        {/* 상품명 검색창 */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", minWidth: "240px" }}>
          <input
            type="text"
            className={sh.search}
            placeholder="상품명 검색..."
            value={tempKeyword}
            onChange={(e) => setTempKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setKeyword(tempKeyword);
              }
            }}
            style={{ height: "36px", padding: "0 var(--space-3)", flex: 1, minWidth: "0" }}
          />
          <Button
            size="sm"
            onClick={() => setKeyword(tempKeyword)}
            style={{ height: "36px", whiteSpace: "nowrap" }}
          >
            검색
          </Button>
        </div>

        <div className={sh.spacer} />
        <Link to="/admin/products/new">
          <Button size="sm" style={{ height: "36px" }}>
            <Plus size={15} /> 상품 등록
          </Button>
        </Link>
      </div>

      <div className={sh.list}>
        {products.length === 0 ? (
          <p className={sh.muted} style={{ textAlign: "center", padding: "40px 0" }}>
            등록된 상품이 없습니다.
          </p>
        ) : (
          products.map((p) => {
            const statusInfo = getProductStatus(p.stock);
            // categoryId와 매핑되는 한글 카테고리명 계층 조회 (소분류/대분류 모두 대응)
            const catPath = findCategoryPath(categories, p.categoryId);
            const categoryLabel = catPath.length > 0 ? catPath.map((c) => c.name).join(" > ") : "미분류";

            return (
              <Card key={p.id} className={styles.card}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className={styles.thumb} />
                ) : (
                  <div className={styles.thumb} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "var(--color-text-muted)" }}>
                    이미지 없음
                  </div>
                )}
                <div className={styles.body}>
                  <div className={styles.line}>
                    <span className={styles.name}>{p.name}</span>
                    <span className={`${sh.badge} ${statusInfo.style}`}>{statusInfo.label}</span>
                  </div>
                  <div className={styles.line}>
                    <span className={styles.meta}>
                      {categoryLabel} · ₩{p.price.toLocaleString()} · 재고 {p.stock?.toLocaleString() ?? 0}개
                    </span>
                    <div className={styles.btnGroup}>
                      <Link to={`/admin/products/edit/${p.id}`}>
                        <Button variant="ghost" size="sm">
                          수정
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(p.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
}
