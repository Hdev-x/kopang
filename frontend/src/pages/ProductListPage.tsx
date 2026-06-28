import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ProductCard } from "../components/ProductCard";
import { getProducts } from "../api/products";
import type { Product } from "../types/product";
import styles from "./ProductListPage.module.css";

export function ProductListPage() {
  const [params] = useSearchParams();
  const category = params.get("category");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // category가 바뀌면 다시 fetch (mock은 동일 반환)
    getProducts()
      .then((page) => setProducts(page.content))
      .catch((err) => console.error("상품 목록 불러오기 실패:", err))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <Layout>
      <h1 className={styles.title}>{category ?? "전체 상품"}</h1>
      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <div className={styles.grid}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}
