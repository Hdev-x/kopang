import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { ProductCard } from "../../components/ProductCard";
import { getWishlist } from "../../api/wishlist";
import type { Product } from "../../types/product";
import s from "../../styles/AccountPages.module.css";

export function WishlistPage() {
  const [items, setItems] = useState<Product[]>([]);

  const fetchWishlist = () => {
    getWishlist()
      .then((data) => {
        const mapped = data.map((w) => {
          const discountRate = w.price > 0 && w.discountPrice 
            ? Math.round(((w.price - w.discountPrice) / w.price) * 100) 
            : undefined;
          return {
            id: w.productId,
            name: w.name,
            price: w.price,
            imageUrl: w.imageUrl || "",
            discountRate,
          };
        });
        setItems(mapped);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleWishChange = (productId: number, isWished: boolean) => {
    if (!isWished) {
      setItems((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  return (
    <Layout>
      <PageHeader title="찜한 상품" />
      {items.length === 0 ? (
        <p className={s.empty}>찜한 상품이 없어요.</p>
      ) : (
        <div className={s.grid}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} onWishChange={handleWishChange} />
          ))}
        </div>
      )}
    </Layout>
  );
}
