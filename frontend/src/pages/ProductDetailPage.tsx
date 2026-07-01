import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { AddToCartModal } from "../components/AddToCartModal";
import { getProduct } from "../api/products";
import type { Product } from "../types/product";
import styles from "./ProductDetailPage.module.css";

// 목업 리뷰
const REVIEWS = [
  { name: "김**", rating: 5, text: "믿고 먹는 코팡! 신선하고 배송도 빨라요." },
  { name: "이**", rating: 4, text: "가성비 좋네요. 재구매 의사 있습니다." },
];
// 목업 상품문의
const PRODUCT_QNA = [
  { q: "재고 언제 다시 들어오나요?", a: "이번 주 내 입고 예정입니다.", status: "답변완료" },
  { q: "유통기한이 어떻게 되나요?", a: null, status: "답변대기" },
];

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [wished, setWished] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<"review" | "qna">("review");

  useEffect(() => {
    if (id) getProduct(Number(id)).then(setProduct).catch(console.error);
  }, [id]);

  if (!product) {
    return (
      <Layout>
        <p>불러오는 중...</p>
      </Layout>
    );
  }

  const discounted = product.discountRate
    ? Math.round((product.price * (100 - product.discountRate)) / 100)
    : product.price;

  return (
    <Layout>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className={styles.image} />
      ) : (
        <div className={styles.image} />
      )}

      {product.brand && <p className={styles.brand}>{product.brand}</p>}
      <h1 className={styles.name}>{product.name}</h1>

      <div className={styles.priceRow}>
        {product.discountRate ? (
          <>
            <span className={styles.discount}>{product.discountRate}%</span>
            <span className={styles.price}>{discounted.toLocaleString()}원</span>
            <span className={styles.origin}>{product.price.toLocaleString()}원</span>
          </>
        ) : (
          <span className={styles.price}>{product.price.toLocaleString()}원</span>
        )}
      </div>

      {typeof product.stock === "number" && (
        <p className={styles.stock}>
          {product.stock > 0 ? `재고 ${product.stock}개 남음` : "품절"}
        </p>
      )}

      {product.description && <p className={styles.desc}>{product.description}</p>}

      <div className={styles.ctaRow}>
        <button
          type="button"
          className={`${styles.wish} ${wished ? styles.wishOn : ""}`}
          onClick={() => setWished((v) => !v)}
          aria-label="찜"
        >
          <Heart size={22} strokeWidth={2.2} fill={wished ? "currentColor" : "none"} />
        </button>
        <Button className={styles.cta} onClick={() => setModalOpen(true)}>
          장바구니 담기
        </Button>
      </div>

      {/* 비슷한 상품 (content-based 추천 자리) */}
      <h2 className={styles.section}>비슷한 상품</h2>
      <div className={styles.similarRow}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <Card key={n} className={styles.similarCard}>
            <div className={styles.similarThumb} />
            <p className={styles.similarName}>추천 상품 {n}</p>
          </Card>
        ))}
      </div>

      {/* 리뷰 / 상품문의 탭 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "review" ? styles.tabActive : ""}`}
          onClick={() => setTab("review")}
        >
          리뷰 {REVIEWS.length}
        </button>
        <button
          className={`${styles.tab} ${tab === "qna" ? styles.tabActive : ""}`}
          onClick={() => setTab("qna")}
        >
          상품문의 {PRODUCT_QNA.length}
        </button>
      </div>

      {tab === "review" ? (
        REVIEWS.map((r, i) => (
          <Card key={i} className={styles.review}>
            <p className={styles.rating}>
              {"★".repeat(r.rating)}
              {"☆".repeat(5 - r.rating)} <span className={styles.reviewer}>{r.name}</span>
            </p>
            <p>{r.text}</p>
          </Card>
        ))
      ) : (
        <>
          <Button variant="ghost" className={styles.askBtn} onClick={() => navigate("/qna/write")}>
            상품 문의하기
          </Button>
          {PRODUCT_QNA.map((item, i) => (
            <Card key={i} className={styles.review}>
              <p className={styles.qnaQ}>
                Q. {item.q}
                <span className={`${styles.qnaStatus} ${item.status === "답변완료" ? styles.done : styles.wait}`}>
                  {item.status}
                </span>
              </p>
              {item.a && <p className={styles.qnaA}>A. {item.a}</p>}
            </Card>
          ))}
        </>
      )}

      <AddToCartModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Layout>
  );
}
