import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { ProductCard } from "../components/ProductCard";
import { getProducts } from "../api/products";
import type { Product } from "../types/product";
import s from "./AccountPages.module.css";

export function WishlistPage() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    // 목업: 샘플 상품을 찜 목록으로
    getProducts().then((p) => setItems(p.content.slice(0, 6))).catch(console.error);
  }, []);

  return (
    <Layout>
      <PageHeader title="찜한 상품" />
      {items.length === 0 ? (
        <p className={s.empty}>찜한 상품이 없어요.</p>
      ) : (
        <div className={s.grid}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}
