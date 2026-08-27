import type { ReactNode } from "react";
import styles from "./Card.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Card({ children, className, onClick }: Props) {
  return (
    <div className={`${styles.card} ${className ?? ""}`} onClick={onClick}>
      {children}
    </div>
  );
}
