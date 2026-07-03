import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { AdminLayout } from "../components/AdminLayout";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import sh from "./adminShared.module.css";
import styles from "./AdminProductsPage.module.css";

// 목업 데이터 (img = 대표이미지)
const PRODUCTS = [
  { id: 1, name: "유기농 오이 3입", cat: "식품", price: 1500, stock: 320, status: "판매중", img: "/images/bakery/1.jpg" },
  { id: 2, name: "제주 삼다수 2L x6", cat: "식품", price: 6900, stock: 12, status: "품절임박", img: "/images/beverage/1.jpg" },
  { id: 3, name: "무선 마우스", cat: "전자", price: 18900, stock: 0, status: "품절", img: "/images/earphones/2.jpg" },
  { id: 4, name: "주방세제 리필", cat: "생활", price: 3200, stock: 540, status: "판매중", img: "/images/detergent/1.jpg" },
  { id: 5, name: "USB-C 충전기 30W", cat: "전자", price: 15900, stock: 88, status: "판매중", img: "/images/earphones/4.jpg" },
];
const CATS = ["전체", "식품", "생활", "전자"];

function statusBadge(s: string) {
  if (s === "판매중") return sh.bOk;
  if (s === "품절임박") return sh.bWarn;
  return sh.bDanger;
}

export function AdminProductsPage() {
  const [cat, setCat] = useState("전체");
  const rows = cat === "전체" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat);

  return (
    <AdminLayout title="상품 관리">
      <div className={sh.toolbar}>
        <div className={sh.filters}>
          {CATS.map((c) => (
            <button
              key={c}
              className={`${sh.chip} ${cat === c ? sh.chipActive : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className={sh.spacer} />
        <Link to="/admin/products/new">
          <Button size="sm">
            <Plus size={15} /> 상품 등록
          </Button>
        </Link>
      </div>

      <div className={sh.list}>
        {rows.map((p) => (
          <Card key={p.id} className={styles.card}>
            <img src={p.img} alt={p.name} className={styles.thumb} />
            <div className={styles.body}>
              <div className={styles.line}>
                <span className={styles.name}>{p.name}</span>
                <span className={`${sh.badge} ${statusBadge(p.status)}`}>{p.status}</span>
              </div>
              <div className={styles.line}>
                <span className={styles.meta}>
                  {p.cat} · ₩{p.price.toLocaleString()} · 재고 {p.stock.toLocaleString()}
                </span>
                <Button variant="ghost" size="sm">수정</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
