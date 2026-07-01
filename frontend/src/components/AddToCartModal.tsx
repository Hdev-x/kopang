import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import styles from "./AddToCartModal.module.css";

type Props = { open: boolean; onClose: () => void };

// 담기 후 선택 모달: 계속 쇼핑 / 장바구니 보기 (목업 — 실제 담기 저장은 안 함)
export function AddToCartModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <p className={styles.msg}>🛒 장바구니에 담았어요</p>
        <div className={styles.actions}>
          <Button variant="ghost" className={styles.keep} onClick={onClose}>
            계속 쇼핑하기
          </Button>
          <Button onClick={() => navigate("/cart")}>장바구니 보기</Button>
        </div>
      </div>
    </div>
  );
}
