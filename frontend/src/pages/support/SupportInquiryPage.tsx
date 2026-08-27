import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { createQna } from "../../api/qna";
import { getProduct } from "../../api/products";
import type { Product } from "../../types/product";
import s from "../../styles/AccountPages.module.css";

export function SupportInquiryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const typeParam = params.get("type");
  const productIdParam = params.get("productId");

  const [type, setType] = useState<"GENERAL" | "PRODUCT">(
    typeParam === "PRODUCT" ? "PRODUCT" : "GENERAL"
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productIdParam) {
      const pid = Number(productIdParam);
      if (!isNaN(pid) && pid > 0) {
        getProduct(pid)
          .then(setProduct)
          .catch(() => setProduct(null));
      }
    }
  }, [productIdParam]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const finalType = type === "PRODUCT" && !product ? "GENERAL" : type;
    setSubmitting(true);

    try {
      await createQna(
        title.trim(),
        content.trim(),
        finalType,
        product ? product.id : undefined
      );
      window.alert("문의가 등록되었습니다.");
      navigate(`/my/inquiries?tab=${finalType === "PRODUCT" ? "product" : "general"}`);
    } catch (error) {
      console.error("1:1 문의 등록 실패:", error);
      window.alert("문의 등록에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <PageHeader title={type === "PRODUCT" ? "상품 문의하기" : "1:1 문의하기"} backTo="/my/inquiries" />
      <form className={s.form} onSubmit={submit}>
        <div className={s.col}>
          <label className={s.muted}>문의 유형</label>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => setType("GENERAL")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid " + (type === "GENERAL" ? "var(--color-primary, #007bff)" : "#ddd"),
                backgroundColor: type === "GENERAL" ? "rgba(0,123,255,0.08)" : "#fff",
                color: type === "GENERAL" ? "var(--color-primary, #007bff)" : "#666",
                fontWeight: type === "GENERAL" ? 600 : 400,
                cursor: "pointer",
              }}
            >
              일반 1:1 문의
            </button>
            <button
              type="button"
              onClick={() => setType("PRODUCT")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid " + (type === "PRODUCT" ? "var(--color-primary, #007bff)" : "#ddd"),
                backgroundColor: type === "PRODUCT" ? "rgba(0,123,255,0.08)" : "#fff",
                color: type === "PRODUCT" ? "var(--color-primary, #007bff)" : "#666",
                fontWeight: type === "PRODUCT" ? 600 : 400,
                cursor: "pointer",
              }}
            >
              상품 문의
            </button>
          </div>
        </div>

        {type === "PRODUCT" && (
          product ? (
            <div style={{ display: "flex", gap: "12px", padding: "12px", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee", alignItems: "center" }}>
              <img src={product.imageUrl} alt={product.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px" }} />
              <div>
                <span style={{ fontSize: "11px", color: "#888", display: "block" }}>문의 상품</span>
                <strong style={{ fontSize: "13px", color: "#333" }}>{product.name}</strong>
                <span style={{ fontSize: "12px", color: "#007bff", fontWeight: 600, display: "block" }}>{product.price.toLocaleString()}원</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "#666", backgroundColor: "#f5f7fa", padding: "10px 12px", borderRadius: "6px" }}>
              💡 특정 상품 문의는 상품 상세 페이지의 <strong>[상품 문의]</strong> 버튼을 이용해 주시거나, 일반 문의는 <strong>[일반 1:1 문의]</strong>로 등록해 주세요.
            </div>
          )
        )}

        <Input
          label="제목"
          placeholder="문의 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className={s.col}>
          <label className={s.muted}>내용</label>
          <textarea
            placeholder="문의 내용을 상세히 입력해 주세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3)",
              minHeight: "140px",
              fontFamily: "inherit",
              fontSize: "var(--font-md)",
              resize: "vertical",
            }}
          />
        </div>
        <Button type="submit" className={s.submit} disabled={!title.trim() || !content.trim() || submitting}>
          {submitting ? "등록 중..." : "등록"}
        </Button>
      </form>
    </Layout>
  );
}
