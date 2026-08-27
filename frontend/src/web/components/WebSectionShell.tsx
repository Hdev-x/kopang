import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { WebLayout } from "./WebLayout";
import styles from "./WebSectionShell.module.css";

export type ShellSection = { title: string; description: string; content?: ReactNode };

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  sections: ShellSection[];
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
};

export function WebSectionShell({ eyebrow, title, description, sections, primary, secondary }: Props) {
  return (
    <WebLayout>
      <header className={styles.hero}><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></header>
      <div className={styles.layout}>
        <section className={styles.content}>
          {sections.map((section) => (
            <article key={section.title} className={styles.card}>
              <div><CheckCircle2 size={20} /><h2>{section.title}</h2></div>
              <p>{section.description}</p>
              {section.content}
            </article>
          ))}
        </section>
        {(primary || secondary) && <aside className={styles.actions}>
          <h2>다음 단계</h2><p>필요한 정보를 확인한 후 계속 진행해 주세요.</p>
          {primary && <Link className={styles.primary} to={primary.to}>{primary.label}<ArrowRight size={18} /></Link>}
          {secondary && <Link className={styles.secondary} to={secondary.to}>{secondary.label}</Link>}
        </aside>}
      </div>
    </WebLayout>
  );
}
