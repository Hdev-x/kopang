import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Home } from "lucide-react";
import { logout } from "../lib/auth";
import styles from "./AdminLayout.module.css";

// 관리자 전용 셸 — 모바일 퍼스트. 가로 네비 대신 햄버거 드로어.
type Item = { to: string; label: string; exact?: boolean };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: "", items: [{ to: "/admin", label: "대시보드", exact: true }] },
  {
    title: "이탈 방지",
    items: [
      { to: "/admin/churn", label: "대시보드" },
      { to: "/admin/churn/customers", label: "위험 고객" },
      { to: "/admin/churn/report", label: "효과 리포트" },
      { to: "/admin/interventions", label: "대응 이력" },
    ],
  },
  {
    title: "운영",
    items: [
      { to: "/admin/products", label: "상품 관리" },
      { to: "/admin/orders", label: "주문·배송" },
      { to: "/admin/members", label: "회원 관리" },
      { to: "/admin/membership", label: "멤버십 관리" },
    ],
  },
  {
    title: "부가",
    items: [{ to: "/admin/coupons", label: "쿠폰·이벤트" }],
  },
  {
    title: "바로가기",
    items: [{ to: "/", label: "🏠 쇼핑몰 홈으로 이동" }],
  },
];

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const active = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <div className={styles.wrap}>
      <div className={styles.scroll}>
        <header className={styles.top}>
          <div className={styles.topInner}>
            <button className={styles.iconBtn} onClick={() => setOpen(true)} aria-label="메뉴">
              <Menu size={22} />
            </button>
            <span className={styles.brand}>KOPANG 관리자</span>
            <button className={styles.iconBtn} onClick={() => navigate("/")} aria-label="쇼핑몰 홈">
              <Home size={20} />
            </button>
          </div>
        </header>

        <main className={styles.main}>
          <h1 className={styles.title}>{title}</h1>
          {children}
        </main>
      </div>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <aside className={styles.drawer}>
            <div className={styles.drawerHead}>
              <span className={styles.drawerTitle}>관리자 메뉴</span>
              <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="닫기">
                <X size={22} />
              </button>
            </div>
            <nav className={styles.menu}>
              {GROUPS.map((g, gi) => (
                <div key={gi} className={styles.group}>
                  {g.title && <p className={styles.groupTitle}>{g.title}</p>}
                  {g.items.map((it) => (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={() => setOpen(false)}
                      className={`${styles.menuItem} ${active(it.to, it.exact) ? styles.menuActive : ""}`}
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}
