import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Bookmark, Search, ShoppingCart, X } from "lucide-react";
import { getNotifications } from "../../api/notifications";
import { getMembershipStatus } from "../../api/membership";
import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../lib/auth";
import { WebQuickBar } from "./WebQuickBar";
import { WebChatbot } from "./WebChatbot";
import { WebFooter } from "./WebFooter";
import styles from "./WebLayout.module.css";

type Props = {
  children: ReactNode;
};

const PRIMARY_NAV = [
  { to: "/web", label: "쇼핑홈" },
  { to: "/web/products", label: "전체상품" },
  { to: "/web/products?sort=popular", label: "베스트" },
  { to: "/web/products?sort=discount", label: "오늘의특가" },
];

const SECONDARY_NAV = [
  { to: "/web", label: "홈" },
  { to: "/web/products?sort=recommended", label: "추천" },
  { to: "/web/products", label: "카테고리" },
  { to: "/web/products?sort=popular", label: "베스트" },
  { to: "/web/products?sort=latest", label: "신상품" },
];

const ACCOUNT_NAV = [
  { to: "/web/my", label: "프로필" },
  { to: "/web/my/orders", label: "나의 쇼핑" },
  { to: "/web/my/reviews", label: "나의 리뷰" },
  { to: "/web/my/profile", label: "설정" },
];

const SHOP_NAV = [
  { to: "/web", label: "쇼핑홈" },
  { to: "/web/products", label: "카테고리" },
  { to: "/web/products?sort=popular", label: "베스트" },
  { to: "/web/products?view=deal", label: "오늘의딜" },
  { to: "/web/products?view=only", label: "단독상품" },
  { to: "/web/membership", label: "멤버십" },
  { to: "/web/products?sort=latest", label: "신상품" },
];

export function WebLayout({ children }: Props) {
  const user = useAuth();
  const [promotionVisible, setPromotionVisible] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const currentLocation = `${location.pathname}${location.search}`;
  const inAccount = path.startsWith("/web/my");
  const inShop = path.startsWith("/web/products") || path === "/web/search" || path === "/web/cart";
  const secondaryItems = inAccount ? ACCOUNT_NAV : inShop ? SHOP_NAV : SECONDARY_NAV;

  useEffect(() => {
    if (!user) {
      setIsMember(false);
      return;
    }
    getNotifications().then((items) => setUnreadCount(items.filter((item) => !item.read).length)).catch(() => setUnreadCount(0));
    getMembershipStatus()
      .then((status) => {
        if (status && status.status === "ACTIVE") {
          setIsMember(true);
        } else {
          setIsMember(false);
        }
      })
      .catch(() => setIsMember(false));
  }, [user]);

  return (
    <div className={styles.page}>
      {promotionVisible && !isMember && <div className={styles.promotion}><Link to="/web/membership">첫 구매부터 시작되는 Kopang 멤버십 혜택 <strong>확인하기</strong></Link><button type="button" onClick={() => setPromotionVisible(false)} aria-label="프로모션 닫기"><X size={22} /></button></div>}
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
                <div className={styles.profileWrap}><button type="button" className={styles.profile} aria-label={`${user.name} 사용자 메뉴`} aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>{user.name.trim().slice(0, 1).toUpperCase()}</button>{profileOpen && <nav className={styles.profileMenu} aria-label="사용자 메뉴"><Link to="/web/my" onClick={() => setProfileOpen(false)}>마이페이지</Link><Link to="/web/membership" onClick={() => setProfileOpen(false)}>멤버십</Link><Link to="/web/support" onClick={() => setProfileOpen(false)}>고객센터</Link><Link to="/mobile" className={styles.viewMenuItem} onClick={() => setProfileOpen(false)}>모바일 화면</Link>{user.role === "ADMIN" && <Link to="/admin" className={styles.adminMenuItem} onClick={() => setProfileOpen(false)}>관리자 페이지</Link>}<button type="button" onClick={() => { logout(); setProfileOpen(false); }}>로그아웃</button></nav>}</div>
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
        <nav className={`${styles.secondaryNav} ${inAccount ? styles.accountNav : ""}`} aria-label={inAccount ? "마이페이지 메뉴" : inShop ? "쇼핑 메뉴" : "웹 홈 세부 메뉴"}><div>{secondaryItems.map((item) => <Link key={item.label} to={item.to} className={(item.to.includes("?") ? currentLocation === item.to : (item.to === "/web/my" || item.to === "/web/products" ? path === item.to : path.startsWith(item.to))) ? styles.secondaryActive : ""}>{item.label}</Link>)}</div></nav>
      </header>

      <main className={styles.main}>{children}</main>
      <WebFooter />
      <WebQuickBar />
      <WebChatbot />
    </div>
  );
}
