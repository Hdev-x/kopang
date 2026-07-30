import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createQna } from "../../api/qna";
import { getProduct } from "../../api/products";
import { useAuth } from "../../hooks/useAuth";
import type { Product } from "../../types/product";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebInquiryWritePage.module.css";

export function WebInquiryWritePage() {
  const navigate = useNavigate();
  const user = useAuth();
  const [searchParams] = useSearchParams();

  const typeParam = searchParams.get("type");
  const productIdParam = searchParams.get("productId");

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      if (window.confirm("로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?")) {
        navigate("/web/login");
      }
      return;
    }

    if (!title.trim()) {
      window.alert("문의 제목을 입력해 주세요.");
      return;
    }

    if (!content.trim()) {
      window.alert("문의 내용을 상세히 작성해 주세요.");
      return;
    }

    const finalType = (type === "PRODUCT" && !product) ? "GENERAL" : type;
    setSubmitting(true);
    try {
      await createQna(
        title.trim(),
        content.trim(),
        finalType,
        product ? product.id : undefined
      );
      window.alert("문의가 등록되었습니다.");
      navigate("/web/my/inquiries");
    } catch {
      window.alert("문의 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WebLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>1:1 문의 작성</h1>
          <p>궁금하신 점이나 불편한 사항을 작성해 주시면 신속하게 답변드리겠습니다.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>문의 유형</label>
            <div className={styles.typeSelector}>
              <button
                type="button"
                className={type === "GENERAL" ? styles.typeActive : ""}
                onClick={() => setType("GENERAL")}
              >
                일반 / 서비스 문의
              </button>
              <button
                type="button"
                className={type === "PRODUCT" ? styles.typeActive : ""}
                onClick={() => setType("PRODUCT")}
              >
                상품 문의
              </button>
            </div>
          </div>

          {type === "PRODUCT" && (
            product ? (
              <div className={styles.productCard}>
                <img src={product.imageUrl} alt={product.name} />
                <div>
                  <span className={styles.productLabel}>문의 상품</span>
                  <strong>{product.name}</strong>
                  <span>{product.price.toLocaleString()}원</span>
                </div>
              </div>
            ) : (
              <div className={styles.productNotice}>
                💡 <strong>안내:</strong> 특정 상품에 대한 문의는 해당 상품 상세 페이지의 <strong>[상품 문의하기]</strong> 버튼을 통해 작성하시거나, 일반적인 문의는 <strong>[일반 / 서비스 문의]</strong>로 등록해 주세요. (상품 정보가 선택되지 않은 경우 일반 문의로 자동 분류되어 등록됩니다.)
              </div>
            )
          )}

          <div className={styles.field}>
            <label htmlFor="inquiry-title">제목</label>
            <input
              id="inquiry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문의 제목을 입력해 주세요"
              maxLength={100}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="inquiry-content">문의 내용</label>
            <textarea
              id="inquiry-content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의하실 내용을 구체적으로 작성해 주세요 (상품, 결제, 배송 등)"
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => navigate(-1)}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? "등록 중..." : "문의 등록하기"}
            </button>
          </div>
        </form>
      </div>
    </WebLayout>
  );
}
