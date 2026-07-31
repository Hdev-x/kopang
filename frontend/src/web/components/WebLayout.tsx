import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Bell, Bookmark, Clock3, Search, ShoppingCart, X } from "lucide-react";
import { addSearchHistory, clearSearchHistory, deleteSearchHistory, getSearchHistory, type SearchHistory } from "../../api/products";
import { getNotifications } from "../../api/notifications";
import { useAuth } from "../../hooks/useAuth";
import { useMembership } from "../../hooks/useMembership";
import { logout } from "../../lib/auth";
import { toMobilePath } from "../../routes/platformPath";
import { WebQuickBar } from "./WebQuickBar";
import { WebChatbot } from "./WebChatbot";
import { WebFooter } from "./WebFooter";
import styles from "./WebLayout.module.css";

type Props = {
  children: ReactNode;
};

// 라벨과 실제 결과가 1:1이 되도록 4개만 남겼다.
// 뺀 것: "쇼핑홈"(로고가 같은 /web로 간다) · "카테고리"(전체상품과 같은 URL이고 목록 사이드바가 담당)
//        "오늘의딜"·"단독상품"(?view=는 제목만 바꾸고 목록이 같았다) · "추천"(?sort=recommended를 백엔드가 모른다)
const PRIMARY_NAV = [
  { to: "/web/products", label: "전체상품" },
  { to: "/web/products?sort=popular", label: "베스트" },
  { to: "/web/products?sort=discount", label: "오늘의특가" },
  { to: "/web/products?sort=latest", label: "신상품" },
];

// 2차 내비는 마이페이지에만 둔다. 홈·쇼핑에서는 상단 메뉴·목록 사이드바와 항목이 겹쳤다.
const ACCOUNT_NAV = [
  { to: "/web/my", label: "프로필" },
  { to: "/web/my/orders", label: "나의 쇼핑" },
  { to: "/web/my/reviews", label: "나의 리뷰" },
  { to: "/web/my/profile", label: "설정" },
];

/** 배너를 닫은 사실은 탭이 살아 있는 동안 유지한다 (WebLayout이 이동마다 재마운트되므로 state로는 못 남는다). */
const PROMOTION_DISMISSED = "kopang_web_promotion_dismissed";

export function WebLayout({ children }: Props) {
  const user = useAuth();
  const isMember = useMembership();
  const [promotionDismissed, setPromotionDismissed] = useState(() => sessionStorage.getItem(PROMOTION_DISMISSED) === "1");
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const currentLocation = `${location.pathname}${location.search}`;
  const inAccount = path.startsWith("/web/my");

  // 멤버십 여부를 알기 전(undefined)에는 배너를 그리지 않는다.
  // false로 가정하고 그렸다가 회원으로 확인되면 48px이 사라지며 화면이 밀린다.
  const showPromotion = isMember === false && !promotionDismissed;

  const dismissPromotion = () => {
    sessionStorage.setItem(PROMOTION_DISMISSED, "1");
    setPromotionDismissed(true);
  };

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recentKeywords, setRecentKeywords] = useState<SearchHistory[]>([]);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [location.search]);

  const loadRecentKeywords = () => {
    getSearchHistory()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRecentKeywords(data);
        } else {
          loadLocalHistory();
        }
      })
      .catch(() => loadLocalHistory());
  };

  const loadLocalHistory = () => {
    try {
      const localData = JSON.parse(localStorage.getItem("kopang_recent_searches") || "[]");
      setRecentKeywords(
        Array.isArray(localData)
          ? localData.map((k: string, idx: number) => ({ searchId: idx, userId: 0, keyword: k, searchedAt: "" }))
          : []
      );
    } catch {
      setRecentKeywords([]);
    }
  };

  const saveLocalHistory = (keyword: string) => {
    try {
      const current = JSON.parse(localStorage.getItem("kopang_recent_searches") || "[]") as string[];
      const next = [keyword, ...current.filter((k) => k !== keyword)].slice(0, 10);
      localStorage.setItem("kopang_recent_searches", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const executeSearch = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
    setIsSearchOpen(false);

    if (user) {
      addSearchHistory(trimmed).catch(() => undefined);
    }
    saveLocalHistory(trimmed);
    navigate(`/web/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleDeleteHistoryItem = (item: SearchHistory) => {
    if (user && item.searchId !== undefined) {
      deleteSearchHistory(item.searchId).catch(() => undefined);
    }
    try {
      const current = JSON.parse(localStorage.getItem("kopang_recent_searches") || "[]") as string[];
      const next = current.filter((k) => k !== item.keyword);
      localStorage.setItem("kopang_recent_searches", JSON.stringify(next));
    } catch {
      // ignore
    }
    setRecentKeywords((prev) => prev.filter((k) => k.keyword !== item.keyword));
  };

  const handleClearAllHistory = () => {
    if (user) {
      clearSearchHistory().catch(() => undefined);
    }
    try {
      localStorage.removeItem("kopang_recent_searches");
    } catch {
      // ignore
    }
    setRecentKeywords([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    getNotifications().then((items) => setUnreadCount(items.filter((item) => !item.read).length)).catch(() => setUnreadCount(0));
  }, [user]);

  return (
    <div className={styles.page}>
      {showPromotion && <div className={styles.promotion}><Link to="/web/membership">첫 구매부터 시작되는 Kopang 멤버십 혜택 <strong>확인하기</strong></Link><button type="button" onClick={dismissPromotion} aria-label="프로모션 닫기"><X size={22} /></button></div>}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/web" className={styles.logo}>Kopang</Link>

          <nav className={styles.nav} aria-label="웹 주요 메뉴">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.label} to={item.to} className={`${styles.navItem} ${(item.to.includes("?") ? currentLocation === item.to : path === item.to) ? styles.navActive : ""}`}>{item.label}</Link>
            ))}
          </nav>

          <div className={styles.searchWrapper} ref={searchWrapperRef}>
            <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
              <Search size={18} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="통합검색 (상품명, 브랜드)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsSearchOpen(true);
                  loadRecentKeywords();
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery("")}
                  aria-label="검색어 지우기"
                >
                  <X size={15} />
                </button>
              )}
              <button type="submit" className={styles.searchSubmitBtn}>
                검색
              </button>
            </form>

            {isSearchOpen && (
              <div className={styles.searchDropdown}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownTitle}>
                    <Clock3 size={15} />
                    <span>최근 검색어</span>
                  </div>
                  {recentKeywords.length > 0 && (
                    <button
                      type="button"
                      className={styles.clearAllBtn}
                      onClick={handleClearAllHistory}
                    >
                      전체 삭제
                    </button>
                  )}
                </div>

                {recentKeywords.length > 0 ? (
                  <ul className={styles.historyList}>
                    {recentKeywords.map((item, idx) => (
                      <li key={item.searchId ?? `${item.keyword}-${idx}`} className={styles.historyItem}>
                        <button
                          type="button"
                          className={styles.keywordBtn}
                          onClick={() => executeSearch(item.keyword)}
                        >
                          <span>{item.keyword}</span>
                        </button>
                        <button
                          type="button"
                          className={styles.deleteItemBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHistoryItem(item);
                          }}
                          aria-label="검색어 삭제"
                        >
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.emptyHistory}>최근 검색한 상품이 없어요.</div>
                )}
              </div>
            )}
          </div>

          <div className={styles.accountLinks}>
            {user ? (
              <>
                <Link to="/web/my/wishlist" className={styles.iconLink} aria-label="저장한 상품"><Bookmark size={21} /></Link>
                <Link to="/web/notifications" className={styles.iconLink} aria-label={`알림 ${unreadCount}개`}><Bell size={21} />{unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}</Link>
                <Link to="/web/cart" className={styles.headerCart}><ShoppingCart size={22} aria-hidden="true" /><span className={styles.srOnly}>장바구니</span></Link>
                <div className={styles.profileWrap}>
                  <button type="button" className={styles.profile} aria-label={`${user.name || "사용자"} 사용자 메뉴`} aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
                    {(user.name || "U").trim().slice(0, 1).toUpperCase()}
                  </button>
                  {profileOpen && (
                    <nav className={styles.profileMenu} aria-label="사용자 메뉴">
                      <Link to="/web/my" onClick={() => setProfileOpen(false)}>마이페이지</Link>
                      <Link to="/web/membership" onClick={() => setProfileOpen(false)}>멤버십</Link>
                      <Link to="/web/support" onClick={() => setProfileOpen(false)}>고객센터</Link>
                      <Link to={toMobilePath(path, location.search)} className={styles.viewMenuItem} onClick={() => setProfileOpen(false)}>모바일 화면</Link>
                      {user.role === "ADMIN" && <Link to="/admin" className={styles.adminMenuItem} onClick={() => setProfileOpen(false)}>관리자 페이지</Link>}
                      <button type="button" onClick={() => { logout(); setProfileOpen(false); }}>로그아웃</button>
                    </nav>
                  )}
                </div>
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
        {inAccount && <nav className={`${styles.secondaryNav} ${styles.accountNav}`} aria-label="마이페이지 메뉴"><div>{ACCOUNT_NAV.map((item) => <Link key={item.label} to={item.to} className={(item.to === "/web/my" ? path === item.to : path.startsWith(item.to)) ? styles.secondaryActive : ""}>{item.label}</Link>)}</div></nav>}
      </header>

      <main className={styles.main}>{children}</main>
      <WebFooter />
      <WebQuickBar />
      <WebChatbot />
    </div>
  );
}
