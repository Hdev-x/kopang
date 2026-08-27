import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { createProductReview, updateReview } from "../api/review";
import type { Review } from "../api/review";
import { uploadProductImage } from "../api/products";
import { Button } from "./Button";
import styles from "./WriteReviewModal.module.css";

interface WriteReviewModalProps {
  productId: number;
  reviewToEdit?: Review; // 수정 모드 시 제공
  onClose: () => void;
  onSuccess: () => void;
}

export function WriteReviewModal({ productId, reviewToEdit, onClose, onSuccess }: WriteReviewModalProps) {
  const [rating, setRating] = useState<number>(reviewToEdit ? reviewToEdit.rating : 5);
  const [content, setContent] = useState<string>(reviewToEdit ? reviewToEdit.content : "");
  const [imageUrl, setImageUrl] = useState<string>(reviewToEdit ? (reviewToEdit.image || "") : "");
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRatingClick = (val: number) => {
    setRating(val);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 형식 검증
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setUploading(true);
    try {
      const uploadedUrl = await uploadProductImage(file);
      setImageUrl(uploadedUrl);
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      alert("이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("리뷰 내용을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (reviewToEdit) {
        // 수정 처리
        await updateReview(reviewToEdit.reviewId, {
          rating,
          content,
          imageUrl: imageUrl || undefined,
        });
        alert("리뷰가 성공적으로 수정되었습니다.");
      } else {
        // 신규 등록 처리
        await createProductReview(productId, {
          rating,
          content,
          imageUrl: imageUrl || undefined,
        });
        alert("리뷰가 성공적으로 등록되었습니다.");
      }
      onSuccess();
    } catch (err: any) {
      console.error("리뷰 제출 실패:", err);
      const errMsg = err.response?.data?.message || "리뷰 제출에 실패했습니다.";
      alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>리뷰 작성하기</h3>
        
        {/* 별점 선택 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>평점</label>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                className={`${styles.starBtn} ${val <= rating ? styles.starBtnActive : ""}`}
                onClick={() => handleRatingClick(val)}
                style={{ fontSize: "28px" }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* 리뷰 내용 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>리뷰 내용</label>
          <textarea
            className={styles.textarea}
            placeholder="상품에 대한 솔직한 후기를 남겨주세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* 이미지 업로드 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>리뷰 이미지 첨부</label>
          <input
            type="file"
            ref={fileInputRef}
            className={styles.fileInput}
            accept="image/*"
            onChange={handleFileChange}
          />
          
          {!imageUrl ? (
            <div className={styles.uploadTrigger} onClick={handleUploadClick}>
              {uploading ? (
                <span className={styles.uploadText}>업로드 중...</span>
              ) : (
                <>
                  <span style={{ fontSize: "24px", color: "var(--color-primary)" }}>📷</span>
                  <span className={styles.uploadText}>사진 추가하기</span>
                </>
              )}
            </div>
          ) : (
            <div className={styles.previewWrap}>
              <img src={imageUrl} alt="리뷰 미리보기" className={styles.previewImg} />
              <button type="button" className={styles.removeImgBtn} onClick={handleRemoveImage}>
                ×
              </button>
            </div>
          )}
        </div>

        {/* 작업 버튼 */}
        <div className={styles.actions}>
          <Button variant="ghost" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button className={styles.submitBtn} onClick={handleSubmit} disabled={uploading || submitting}>
            {submitting ? "등록 중..." : "등록 완료"}
          </Button>
        </div>
      </div>
    </div>
  );
}
