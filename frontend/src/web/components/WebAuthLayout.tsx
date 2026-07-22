import type { ReactNode } from "react";
import { CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./WebAuthLayout.module.css";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function WebAuthLayout({ eyebrow, title, description, children }: Props) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/web" className={styles.logo}>Kopang</Link>
        <div className={styles.headerLinks}>
          <Link to="/mobile">모바일 화면</Link>
          <Link to="/web">쇼핑홈</Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <p className={styles.description}>{description}</p>
          <ul className={styles.benefits}>
            <li><Truck size={20} /><span><b>편리한 쇼핑</b>상품 탐색부터 배송 확인까지 한곳에서 이용하세요.</span></li>
            <li><ShieldCheck size={20} /><span><b>안전한 계정 보호</b>인증된 사용자 정보로 주문 내역을 관리합니다.</span></li>
            <li><CheckCircle2 size={20} /><span><b>맞춤형 경험</b>찜·알림·최근 본 상품을 이어서 확인하세요.</span></li>
          </ul>
        </section>
        <section className={styles.panel}>{children}</section>
      </main>

      <footer className={styles.footer}>© Kopang · Web authentication</footer>
    </div>
  );
}
