import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  children: ReactNode;
};

export function Button({ variant = "primary", children, className, ...rest }: Props) {
  return (
    <button className={`${styles.button} ${styles[variant]} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}
