import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../../components/AdminLayout";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import sh from "../adminShared.module.css";
import styles from "./AdminProductFormPage.module.css";

// 필드 = 상세페이지(ProductDetailPage)에 노출되는 내용 그대로.
// 관리자가 여기 입력한 게 사용자 상세페이지에 그대로 보임.
const CATEGORIES = ["식품", "생활", "전자"];

export function AdminProductFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    brand: "",
    price: "",
    discountRate: "",
    stock: "",
    category: "식품",
    imageUrl: "",
    description: "",
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // 목업: 저장하지 않고 목록으로 복귀
    navigate("/admin/products");
  };

  return (
    <AdminLayout title="상품 등록">
      <p className={sh.muted} style={{ marginBottom: "var(--space-4)" }}>
        입력한 내용이 사용자 <strong>상세페이지</strong>에 그대로 노출됩니다.
      </p>

      <form className={styles.form} onSubmit={submit}>
        <Input label="상품명" placeholder="예: 유기농 오이 3입" value={form.name} onChange={set("name")} />
        <Input label="브랜드" placeholder="예: 코팡팜 (선택)" value={form.brand} onChange={set("brand")} />

        <div className={styles.row}>
          <Input label="가격(원)" type="number" placeholder="1500" value={form.price} onChange={set("price")} />
          <Input
            label="할인율(%)"
            type="number"
            placeholder="0"
            value={form.discountRate}
            onChange={set("discountRate")}
          />
        </div>

        <div className={styles.row}>
          <Input label="재고" type="number" placeholder="0" value={form.stock} onChange={set("stock")} />
          <div className={styles.field}>
            <label className={styles.label}>카테고리</label>
            <select className={styles.control} value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>대표 이미지</label>
          <input className={styles.control} type="file" accept="image/*" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>상세 설명</label>
          <textarea
            className={styles.textarea}
            placeholder="상품 설명 (상세페이지 본문)"
            value={form.description}
            onChange={set("description")}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={() => navigate("/admin/products")}>
            취소
          </Button>
          <Button type="submit">등록</Button>
        </div>
      </form>
    </AdminLayout>
  );
}
