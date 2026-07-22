import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgePercent,
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileClock,
  Home,
  Menu,
  Search,
  ShieldCheck,
  Store,
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
    title: "OVERVIEW",
    items: [{ to: "/admin", label: "통합 대시보드", exact: true, icon: BarChart3 }],
  },
  {
    title: "COMMERCE",
    items: [
      { to: "/admin/products", label: "상품 관리", icon: Boxes },
      { to: "/admin/orders", label: "주문·배송", icon: ClipboardList },
      { to: "/admin/coupons", label: "쿠폰·이벤트", icon: TicketPercent },
    ],
  },
  {
    title: "CUSTOMER",
    items: [
      { to: "/admin/members", label: "회원 관리", icon: UsersRound },
      { to: "/admin/membership", label: "멤버십 관리", icon: BadgePercent },
    ],
  },
  {
    title: "RETENTION",
    items: [
      { to: "/admin/churn", label: "이탈 방지", icon: ShieldCheck },
      { to: "/admin/churn/customers", label: "위험 고객", icon: UserRound },
      { to: "/admin/interventions", label: "대응 이력", icon: FileClock },
      { to: "/admin/churn/report", label: "효과 리포트", icon: BarChart3 },
    ],
  },
  {
    title: "CONTENT",
    items: [{ to: "/admin/faqs", label: "FAQ 관리", icon: CircleHelp }],
  },
];

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useLocation().pathname;
  const active = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(`${to}/`);

  return (
    <div className={styles.wrap}>
      {open && <button className={styles.overlay} onClick={() => setOpen(false)} aria-label="메뉴 닫기" />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brandRow}>
          <Link to="/admin" className={styles.brand} onClick={() => setOpen(false)}>
            <span className={styles.brandMark}>K</span>
            <span>
              <strong>KOPANG</strong>
              <small>ADMIN CONSOLE</small>
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

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setOpen(true)} aria-label="관리자 메뉴 열기">
            <Menu size={22} />
          </button>
          <div className={styles.searchBox}>
            <Search size={18} />
            <span>상품, 주문번호, 회원 검색</span>
            <kbd>⌘ K</kbd>
          </div>
          <div className={styles.topActions}>
            <button className={styles.noticeBtn} aria-label="알림">
              <Bell size={20} />
              <span>3</span>
            </button>
            <div className={styles.profile}>
              <span className={styles.avatar}>A</span>
              <span>
                <strong>관리자</strong>
                <small>운영 계정</small>
              </span>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.pageHead}>
            <div>
              <p className={styles.eyebrow}>ADMINISTRATION</p>
              <h1 className={styles.title}>{title}</h1>
            </div>
            <p className={styles.updated}>마지막 업데이트 · 방금 전</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
