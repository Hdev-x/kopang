import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShoppingCart, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { WebQuickBar } from "./WebQuickBar";
import { WebChatbot } from "./WebChatbot";
import { WebFooter } from "./WebFooter";
import styles from "./WebLayout.module.css";

type Props = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { to: "/web", label: "쇼핑홈" },
  { to: "/web/products", label: "카테고리" },
  { to: "/web/products?sort=popular", label: "베스트" },
  { to: "/web/products?sort=latest", label: "신상품" },
];

export function WebLayout({ children }: Props) {
  const user = useAuth();
  const path = useLocation().pathname;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/web" className={styles.logo}>Kopang</Link>

          <Link to="/web/search" className={styles.search}>
            <Search size={20} aria-hidden="true" />
            <span>상품을 검색해보세요</span>
          </Link>

          <div className={styles.accountLinks}>
            <Link to="/mobile" className={styles.viewSwitch}>모바일 화면</Link>
            <Link to="/web/support" className={styles.viewSwitch}>고객센터</Link>
            {user ? (
              <Link to="/web/my" className={styles.accountButton}>
                <User size={20} aria-hidden="true" />
                <span>{user.name}</span>
              </Link>
            ) : (
              <Link to="/web/login" className={styles.accountButton}>로그인</Link>
            )}
            <Link to="/web/cart" className={styles.headerCart}>
              <ShoppingCart size={22} aria-hidden="true" />
              <span>장바구니</span>
            </Link>
          </div>
        </div>

        <nav className={styles.nav} aria-label="웹 쇼핑 메뉴">
          <div className={styles.navInner}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`${styles.navItem} ${path === item.to ? styles.navActive : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className={styles.main}>{children}</main>
      <WebFooter />
      <WebQuickBar />
      <WebChatbot />
    </div>
  );
}
