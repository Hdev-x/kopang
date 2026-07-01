import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, ShoppingCart, User, Search, ChevronLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ChatbotWidget } from "./ChatbotWidget";
import { SearchBarInput } from "./SearchBarInput";
import styles from "./Layout.module.css";

type Props = { children: ReactNode };

export function Layout({ children }: Props) {
  const user = useAuth();
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const onSearch = path === "/search";
  // 검색바는 둘러보는 화면(홈·상품·검색)에서만 노출
  const showSearch = path === "/" || path.startsWith("/products") || onSearch;
  // 상품상세 등은 상단바 로고 자리에 뒤로가기
  const topbarBack = path.startsWith("/products/");
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));
  return (
    <div className={styles.wrapper}>
      {/* 탑바: 고정(sticky) */}
      <header className={styles.topbar}>
        <div className={`container ${styles.topbarInner}`}>
          {topbarBack ? (
            <button
              type="button"
              className={styles.topbarBack}
              onClick={goBack}
              aria-label="뒤로가기"
            >
              <ChevronLeft size={24} strokeWidth={2.2} />
            </button>
          ) : (
            <Link to="/" className={styles.logo}>
              Kopang
            </Link>
          )}
          <div className={styles.icons}>
            {user ? (
              // 로그인 상태: 알림·장바구니·마이 3개 아이콘
              <>
                <Link to="/notifications" className={styles.iconBtn} aria-label="알림">
                  <Bell size={22} strokeWidth={2.2} />
                </Link>
                <Link to="/cart" className={styles.iconBtn} aria-label="장바구니">
                  <ShoppingCart size={22} strokeWidth={2.2} />
                </Link>
                <Link to="/my" className={styles.iconBtn} aria-label="마이페이지">
                  <User size={22} strokeWidth={2.2} />
                </Link>
              </>
            ) : (
              // 비로그인: 로그인 텍스트 버튼만
              <Link to="/login" className={styles.loginBtn}>
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 검색바: 둘러보는 화면에서만. 검색 페이지에선 입력창, 그 외엔 검색 페이지로 가는 버튼 */}
      {showSearch && (
        <div className={`container ${styles.searchWrap}`}>
          {onSearch ? (
            <SearchBarInput />
          ) : (
            <Link to="/search" className={styles.search}>
              <Search size={18} strokeWidth={2.2} className={styles.searchIcon} />
              <span className={styles.searchText}>상품을 검색해보세요</span>
            </Link>
          )}
        </div>
      )}

      <main className={`container ${styles.main} ${showSearch ? "" : styles.mainPadded}`}>
        {children}
      </main>

      {/* AI 상담봇 (플로팅) */}
      <ChatbotWidget />
    </div>
  );
}
