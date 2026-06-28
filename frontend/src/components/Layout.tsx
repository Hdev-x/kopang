import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bell, ShoppingCart, User, Search } from "lucide-react";
import styles from "./Layout.module.css";

type Props = { children: ReactNode };

export function Layout({ children }: Props) {
  return (
    <div className={styles.wrapper}>
      {/* 탑바: 고정(sticky) */}
      <header className={styles.topbar}>
        <div className={`container ${styles.topbarInner}`}>
          <Link to="/" className={styles.logo}>
            Copang
          </Link>
          <div className={styles.icons}>
            {/* TODO: 알림 페이지 연결 */}
            <button type="button" className={styles.iconBtn} aria-label="알림">
              <Bell size={22} strokeWidth={2.2} />
            </button>
            <Link to="/cart" className={styles.iconBtn} aria-label="장바구니">
              <ShoppingCart size={22} strokeWidth={2.2} />
            </Link>
            {/* 계정 진입 (로그인 후 마이페이지 예정) */}
            <Link to="/login" className={styles.iconBtn} aria-label="마이">
              <User size={22} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </header>

      {/* 검색바: 고정 아님 (스크롤됨) */}
      <div className={`container ${styles.searchWrap}`}>
        {/* TODO: 검색 페이지(/search) 연결, 추후 AI 챗봇 검색 */}
        <button type="button" className={styles.search}>
          <Search size={18} strokeWidth={2.2} className={styles.searchIcon} />
          <span className={styles.searchText}>상품을 검색해보세요</span>
        </button>
      </div>

      <main className={`container ${styles.main}`}>{children}</main>
    </div>
  );
}
