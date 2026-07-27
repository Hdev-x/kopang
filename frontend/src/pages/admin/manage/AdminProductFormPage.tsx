import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../../../components/AdminLayout";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { createProduct, getProduct, updateProduct, uploadProductImage } from "../../../api/products";
import { getCategories } from "../../../api/categories";
import type { Category } from "../../../types/category";
import sh from "../adminShared.module.css";
import styles from "./AdminProductFormPage.module.css";

export function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState<Category[]>([]); // 대분류 목록
  const [selectedParentId, setSelectedParentId] = useState<number | "">(""); // 선택된 대분류 ID
  const [subCategories, setSubCategories] = useState<Category[]>([]); // 선택된 대분류의 하위 소분류 목록
  
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    discountRate: "0",
    stock: "",
    categoryId: "", // 최종 선택된 소분류 ID
    imageUrl: "", // 대표 이미지 URL
    description: "",
  });

  // 1. 카테고리 데이터 로드
  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data);
        
        // 신규 등록 모드일 때 초기 카테고리 바인딩
        if (data.length > 0 && !isEdit) {
          const firstParent = data[0];
          setSelectedParentId(firstParent.id);
          
          if (firstParent.children && firstParent.children.length > 0) {
            setSubCategories(firstParent.children);
            setForm((f) => ({ ...f, categoryId: String(firstParent.children![0].id) }));
          } else {
            setSubCategories([]);
            setForm((f) => ({ ...f, categoryId: String(firstParent.id) }));
          }
        }
      })
      .catch((err) => console.error("카테고리 로드 실패:", err));
  }, [isEdit]);

  // 2. 수정 모드일 때 기존 데이터 로드 및 카테고리 계층 매핑 동기화
  useEffect(() => {
    if (!isEdit || categories.length === 0) return;

    getProduct(Number(id))
      .then((p) => {
        if (p) {
          const rate = p.discountRate !== undefined ? p.discountRate : 0;
          
          // 기존 상품의 categoryId(소분류)로부터 부모 카테고리(대분류)를 탐색
          let foundParentId: number | "" = "";
          let foundSubCategories: Category[] = [];

          for (const parent of categories) {
            if (parent.children) {
              const hasChild = parent.children.some((child) => child.id === p.categoryId);
              if (hasChild) {
                foundParentId = parent.id;
                foundSubCategories = parent.children;
                break;
              }
            }
          }

          // 부모 카테고리를 찾지 못했고 해당 categoryId 자체가 대분류인 경우 대비 폴백
          if (foundParentId === "") {
            const isParent = categories.find((c) => c.id === p.categoryId);
            if (isParent) {
              foundParentId = isParent.id;
              foundSubCategories = isParent.children || [];
            }
          }

          setSelectedParentId(foundParentId);
          setSubCategories(foundSubCategories);

          setForm({
            name: p.name,
            price: String(p.price),
            discountRate: String(rate),
            stock: String(p.stock ?? 0),
            categoryId: String(p.categoryId ?? ""),
            imageUrl: p.imageUrl || "",
            description: p.description || "",
          });

          if (p.imageUrls) {
            setUploadedUrls(p.imageUrls);
          }
        }
      })
      .catch((err) => {
        console.error("상품 정보 조회 실패:", err);
        alert("상품 정보를 가져오지 못했습니다.");
        navigate("/admin/products");
      });
  }, [id, isEdit, categories, navigate]);

  const handleChange = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  // 대분류 드롭다운 변경 시 하위 소분류 목록 갱신 및 첫 항목 자동 선택
  const handleParentCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const parentId = Number(e.target.value);
    setSelectedParentId(parentId);

    const parentCat = categories.find((c) => c.id === parentId);
    if (parentCat && parentCat.children && parentCat.children.length > 0) {
      setSubCategories(parentCat.children);
      setForm((f) => ({ ...f, categoryId: String(parentCat.children![0].id) }));
    } else {
      setSubCategories([]);
      setForm((f) => ({ ...f, categoryId: parentId ? String(parentId) : "" }));
    }
  };

  // 파일 다중 선택 즉시 S3에 업로드하고 목록에 추가
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const s3Url = await uploadProductImage(files[i]);
        newUrls.push(s3Url);
      } catch (err) {
        console.error("이미지 업로드 실패:", err);
        alert(`${files[i].name} 파일 업로드에 실패했습니다.`);
      }
    }

    setUploading(false);

    if (newUrls.length > 0) {
      setUploadedUrls((prev) => {
        const updated = [...prev, ...newUrls];
        setForm((f) => {
          if (!f.imageUrl && updated.length > 0) {
            return { ...f, imageUrl: updated[0] };
          }
          return f;
        });
        return updated;
      });
    }
  };

  // 대표 이미지 지정 핸들러
  const handleSelectMain = (url: string) => {
    setForm((f) => ({ ...f, imageUrl: url }));
  };

  // 이미지 카드 제거 핸들러
  const handleRemoveImage = (urlToRemove: string) => {
    setUploadedUrls((prev) => {
      const updated = prev.filter((url) => url !== urlToRemove);

      setForm((f) => {
        if (f.imageUrl === urlToRemove) {
          const nextMain = updated.length > 0 ? updated[0] : "";
          return { ...f, imageUrl: nextMain };
        }
        return f;
      });

      return updated;
    });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();

    const priceNum = Number(form.price) || 0;
    const rateNum = Number(form.discountRate) || 0;
    const stockNum = Number(form.stock) || 0;
    const catIdNum = Number(form.categoryId) || 0;

    if (!form.name.trim()) {
      alert("상품명을 입력해주세요.");
      return;
    }
    if (priceNum <= 0) {
      alert("올바른 가격을 입력해주세요.");
      return;
    }
    if (rateNum < 0 || rateNum > 100) {
      alert("할인율은 0%에서 100% 사이여야 합니다.");
      return;
    }
    if (stockNum < 0) {
      alert("재고 수량은 0 이상이어야 합니다.");
      return;
    }
    if (!catIdNum) {
      alert("소분류 카테고리를 선택해주세요.");
      return;
    }
    if (!form.imageUrl) {
      alert("적어도 하나 이상의 이미지를 업로드하고 대표 이미지로 설정해야 합니다.");
      return;
    }

    const discountPrice = Math.round(priceNum * (1 - rateNum / 100));

    const productData = {
      categoryId: catIdNum,
      name: form.name.trim(),
      description: form.description.trim(),
      price: priceNum,
      discountPrice: discountPrice,
      stock: stockNum,
      imageUrl: form.imageUrl,
      imageUrls: uploadedUrls,
      status: "ACTIVE",
    };

    if (isEdit) {
      updateProduct(Number(id), productData)
        .then(() => {
          alert("상품이 성공적으로 수정되었습니다.");
          navigate("/admin/products");
        })
        .catch((err) => {
          const errMsg = err.response?.data?.message || "상품 수정에 실패했습니다.";
          alert(errMsg);
        });
    } else {
      createProduct(productData)
        .then(() => {
          alert("상품이 성공적으로 등록되었습니다.");
          navigate("/admin/products");
        })
        .catch((err) => {
          const errMsg = err.response?.data?.message || "상품 등록에 실패했습니다.";
          alert(errMsg);
        });
    }
  };

  return (
    <AdminLayout title={isEdit ? "상품 수정" : "상품 등록"}>
      <p className={sh.muted} style={{ marginBottom: "var(--space-1)" }}>
        입력한 내용이 사용자 <strong>상세페이지</strong>에 그대로 노출됩니다.
      </p>

      <div className={styles.formCard}>
        <form className={styles.form} onSubmit={submit}>
          <Input
            label="상품명"
            placeholder="예: 유기농 오이 3입"
            value={form.name}
            onChange={handleChange("name")}
          />

          <div className={styles.row}>
            <Input
              label="가격(원)"
              type="number"
              placeholder="1500"
              value={form.price}
              onChange={handleChange("price")}
            />
            <Input
              label="할인율(%)"
              type="number"
              placeholder="0"
              value={form.discountRate}
              onChange={handleChange("discountRate")}
            />
          </div>

          <div className={styles.row}>
            <Input
              label="재고"
              type="number"
              placeholder="0"
              value={form.stock}
              onChange={handleChange("stock")}
            />
            
            {/* 대분류 선택 */}
            <div className={styles.field}>
              <label className={styles.label}>대분류</label>
              <select
                className={styles.control}
                value={selectedParentId}
                onChange={handleParentCategoryChange}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 소분류 연쇄 선택 */}
            <div className={styles.field}>
              <label className={styles.label}>소분류</label>
              <select
                className={styles.control}
                value={form.categoryId}
                onChange={handleChange("categoryId")}
                disabled={subCategories.length === 0}
              >
                {subCategories.length === 0 ? (
                  <option value="">소분류 없음</option>
                ) : (
                  subCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 다중 이미지 첨부 영역 구획화 */}
          <div className={styles.imageSection}>
            <div className={styles.field}>
              <label className={styles.label}>상품 이미지 등록 (여러 파일 선택 가능 · AWS S3 업로드)</label>
              <input
                className={styles.control}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={{ padding: "8px" }}
              />
            </div>

            {/* 업로드 완료된 다중 이미지 그리드 및 대표 설정 */}
            {(uploadedUrls.length > 0 || uploading) && (
              <div className={styles.field} style={{ marginTop: "16px" }}>
                <label className={styles.label}>등록된 상품 이미지 목록 (원하는 이미지를 대표 이미지로 설정해주세요)</label>
                <div className={styles.imageGrid}>
                  {uploadedUrls.map((url) => {
                    const isMain = form.imageUrl === url;
                    return (
                      <div
                        key={url}
                        className={`${styles.imageCard} ${isMain ? styles.imageCardActive : ""}`}
                      >
                        <img src={url} alt="상품 썸네일" className={styles.imagePreview} />
                        {isMain && <span className={styles.mainBadge}>대표</span>}
                        <button
                          type="button"
                          className={styles.deleteImage}
                          onClick={() => handleRemoveImage(url)}
                          title="이미지 제거"
                        >
                          ✕
                        </button>
                        <div className={styles.imageActions} onClick={() => handleSelectMain(url)}>
                          <label className={styles.radioLabel}>
                            <input
                              type="radio"
                              name="mainImage"
                              checked={isMain}
                              onChange={() => handleSelectMain(url)}
                            />
                            대표 설정
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  {uploading && (
                    <div className={styles.imageCard} style={{ borderStyle: "dashed" }}>
                      <div className={styles.uploadLoading}>
                        <div className={styles.uploadSpinner} />
                        <span>업로드 중...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>상세 설명</label>
            <textarea
              className={styles.textarea}
              placeholder="상품 설명 (상세페이지 본문)"
              value={form.description}
              onChange={handleChange("description")}
            />
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={() => navigate("/admin/products")}>
              취소
            </Button>
            <Button type="submit" disabled={uploading}>
              {isEdit ? "수정 완료" : "등록"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
