import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Search, ShoppingCart, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { WebQuickBar } from "./WebQuickBar";
import { WebChatbot } from "./WebChatbot";
import { WebFooter } from "./WebFooter";
import styles from "./WebLayout.module.css";

type Props = {
  children: ReactNode;
};

const PRIMARY_NAV = [
  { to: "/web", label: "집구경" },
  { to: "/web/products", label: "쇼핑" },
  { to: "/web/products?cat=1", label: "생활/인테리어" },
];

const SECONDARY_NAV = [
  { to: "/web", label: "홈" },
  { to: "/web/products?sort=recommended", label: "추천" },
  { to: "/web/products", label: "카테고리" },
  { to: "/web/products?sort=popular", label: "베스트" },
  { to: "/web/products?sort=latest", label: "신상품" },
];

export function WebLayout({ children }: Props) {
  const user = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const currentLocation = `${location.pathname}${location.search}`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/web" className={styles.logo}><span aria-hidden="true" />Kopang</Link>

          <nav className={styles.nav} aria-label="웹 주요 메뉴">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.label} to={item.to} className={`${styles.navItem} ${(item.to.includes("?") ? currentLocation === item.to : path === item.to) ? styles.navActive : ""}`}>{item.label}</Link>
            ))}
          </nav>

          <Link to="/web/search" className={styles.search}>
            <Search size={20} aria-hidden="true" />
            <span>통합검색</span>
          </Link>

          <div className={styles.accountLinks}>
            <Link to="/web/support" className={styles.viewSwitch}>고객센터</Link>
            {user ? (
              <Link to="/web/my" className={styles.accountButton}>
                <User size={20} aria-hidden="true" />
                <span>{user.name}</span>
              </Link>
            ) : (
              <><Link to="/web/login" className={styles.accountButton}>로그인</Link><Link to="/web/signup" className={styles.viewSwitch}>회원가입</Link></>
            )}
            <Link to="/web/notifications" className={styles.iconLink} aria-label="알림"><Bell size={21} /></Link>
            <Link to="/web/cart" className={styles.headerCart}>
              <ShoppingCart size={22} aria-hidden="true" />
              <span className={styles.srOnly}>장바구니</span>
            </Link>
          </div>
        </div>
        <nav className={styles.secondaryNav} aria-label="웹 홈 세부 메뉴"><div>{SECONDARY_NAV.map((item) => <Link key={item.label} to={item.to} className={(item.to.includes("?") ? currentLocation === item.to : path === item.to) ? styles.secondaryActive : ""}>{item.label}</Link>)}</div></nav>
      </header>

      <main className={styles.main}>{children}</main>
      <WebFooter />
      <WebQuickBar />
      <WebChatbot />
    </div>
  );
}
