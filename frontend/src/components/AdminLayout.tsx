import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  ChartPie,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileClock,
  Home,
  Menu,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  TicketPercent,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import styles from "./AdminLayout.module.css";

type Item = {
  to: string;
  label: string;
  exact?: boolean;
  icon: typeof Home;
};

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "개요",
    items: [{ to: "/admin", label: "통합 대시보드", exact: true, icon: BarChart3 }],
  },
  {
    title: "커머스",
    items: [
      { to: "/admin/products", label: "상품 관리", icon: Boxes },
      { to: "/admin/orders", label: "주문·배송", icon: ClipboardList },
      { to: "/admin/coupons", label: "쿠폰·이벤트", icon: TicketPercent },
      { to: "/admin/recommendations", label: "추천 관리", icon: Sparkles },
      { to: "/admin/stats", label: "구매 분석", icon: ChartPie },
    ],
  },
  {
    title: "고객",
    items: [
      { to: "/admin/inquiries", label: "문의 관리", icon: CircleHelp },
      { to: "/admin/members", label: "회원 관리", icon: UsersRound },
      { to: "/admin/membership", label: "멤버십 관리", icon: BadgePercent },
    ],
  },
  {
    title: "이탈 방지",
    items: [
      { to: "/admin/churn", label: "이탈 대시보드", exact: true, icon: ShieldCheck },
      { to: "/admin/churn/customers", label: "위험 고객", icon: UserRound },
      { to: "/admin/churn/interventions", label: "대응 이력", icon: FileClock },
      { to: "/admin/churn/report", label: "효과 리포트", icon: Target },
    ],
  },
  {
    title: "콘텐츠",
    items: [{ to: "/admin/faqs", label: "FAQ 관리", icon: CircleHelp }],
  },
];

export function AdminLayout({ title, children, fullBleed }: { title: string; children: ReactNode; fullBleed?: boolean }) {
  const [open, setOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // 스크롤 중인 요소에만 .scrolling 부여 → 스크롤할 때만 스크롤바 표시
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const timers = new WeakMap<Element, number>();
    const onScroll = (e: Event) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      t.classList.add("scrolling");
      const prev = timers.get(t);
      if (prev) window.clearTimeout(prev);
      timers.set(t, window.setTimeout(() => t.classList.remove("scrolling"), 400));
    };
    el.addEventListener("scroll", onScroll, true);
    return () => el.removeEventListener("scroll", onScroll, true);
  }, []);
  const path = useLocation().pathname;
  const active = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(`${to}/`);

  return (
    <div className={styles.wrap}>
      {open && <button className={styles.overlay} onClick={() => setOpen(false)} aria-label="메뉴 닫기" />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brandRow}>
          <Link to="/admin" className={styles.brand} onClick={() => setOpen(false)}>
            <span>
              <strong>Kopang</strong>
              <small>관리자 콘솔</small>
            </span>
          </Link>
          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="메뉴 닫기">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.menu} aria-label="관리자 메뉴">
          {GROUPS.map((group) => (
            <section key={group.title} className={styles.group}>
              <p className={styles.groupTitle}>{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`${styles.menuItem} ${active(item.to, item.exact) ? styles.menuActive : ""}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {active(item.to, item.exact) && <ChevronRight size={16} className={styles.activeArrow} />}
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>

        <Link to="/web" className={styles.storeLink}>
          <Store size={18} />
          쇼핑몰 바로가기
          <ChevronRight size={16} />
        </Link>
      </aside>

      {/* fullBleed 페이지는 화면 높이에 딱 맞춰 잡는다.
          calc(100vh - 62px) 로 계산하다 보면 상단바 높이가 소수점(브라우저 배율)일 때
          1px 미만이 넘쳐서 페이지가 미세하게 흔들린다. */}
      <div className={`${styles.workspace} ${fullBleed ? styles.workspaceFixed : ""}`} ref={workspaceRef}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setOpen(true)} aria-label="관리자 메뉴 열기">
            <Menu size={22} />
          </button>
          <h1 className={styles.topTitle}>{title}</h1>
          <div className={styles.topActions}>
            <div className={styles.profile}>
              <span className={styles.profileName}>관리자 님</span>
              <span className={styles.avatar}>관</span>
            </div>
          </div>
        </header>

        <main className={`${styles.main} ${fullBleed ? styles.mainFull : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
