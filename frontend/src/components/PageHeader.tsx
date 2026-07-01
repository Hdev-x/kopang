import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import styles from "./PageHeader.module.css";

// 뒤로가기 + (있으면) 타이틀. title 없으면 ← 만 단독으로.
export function PageHeader({ title }: { title?: string }) {
  const navigate = useNavigate();
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  return (
    <div className={styles.header}>
      <button type="button" className={styles.back} onClick={goBack} aria-label="뒤로가기">
        <ChevronLeft size={24} strokeWidth={2.2} />
        {!title && <span className={styles.backText}>뒤로가기</span>}
      </button>
      {title && <h1 className={styles.title}>{title}</h1>}
    </div>
  );
}
