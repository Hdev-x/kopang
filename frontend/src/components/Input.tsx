import type { InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, id, ...rest }: Props) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <input id={id} className={styles.input} {...rest} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
