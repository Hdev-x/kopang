import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Bookmark, Search, ShoppingCart, X } from "lucide-react";
import { getNotifications } from "../../api/notifications";
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
  const [promotionVisible, setPromotionVisible] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const path = location.pathname;
  const currentLocation = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!user) return;
    getNotifications().then((items) => setUnreadCount(items.filter((item) => !item.read).length)).catch(() => setUnreadCount(0));
  }, [user]);

  return (
    <div className={styles.page}>
      {promotionVisible && <div className={styles.promotion}><Link to="/web/membership">첫 구매부터 시작되는 Kopang 멤버십 혜택 <strong>확인하기</strong></Link><button type="button" onClick={() => setPromotionVisible(false)} aria-label="프로모션 닫기"><X size={22} /></button></div>}
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
            {user ? (
              <>
                <Link to="/web/my/wishlist" className={styles.iconLink} aria-label="저장한 상품"><Bookmark size={21} /></Link>
                <Link to="/web/notifications" className={styles.iconLink} aria-label={`알림 ${unreadCount}개`}><Bell size={21} />{unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}</Link>
                <Link to="/web/cart" className={styles.headerCart}><ShoppingCart size={22} aria-hidden="true" /><span className={styles.srOnly}>장바구니</span></Link>
                <Link to="/web/my" className={styles.profile} aria-label={`${user.name} 마이페이지`}>{user.name.trim().slice(0, 1).toUpperCase()}</Link>
              </>
            ) : (
              <>
                <Link to="/web/cart" className={styles.headerCart}><ShoppingCart size={22} aria-hidden="true" /><span className={styles.srOnly}>장바구니</span></Link>
                <Link to="/web/login" className={styles.accountButton}>로그인</Link>
                <Link to="/web/signup" className={styles.viewSwitch}>회원가입</Link>
                <Link to="/web/support" className={styles.viewSwitch}>고객센터</Link>
              </>
            )}
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
