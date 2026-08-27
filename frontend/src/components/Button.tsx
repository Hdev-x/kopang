import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
  children: ReactNode;
};

export function Button({ variant = "primary", size = "md", children, className, ...rest }: Props) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${size === "sm" ? styles.sm : ""} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
