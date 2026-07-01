import { Link, useLocation } from "react-router-dom";
import sh from "../pages/adminShared.module.css";

// 이탈 관련 관리자 페이지 사이의 서브 탭
const TABS = [
  { to: "/admin/churn", label: "대시보드" },
  { to: "/admin/churn/customers", label: "위험 고객" },
  { to: "/admin/churn/report", label: "효과 리포트" },
  { to: "/admin/interventions", label: "대응 이력" },
];

export function ChurnSubnav() {
  const path = useLocation().pathname;
  return (
    <div className={sh.subnav}>
      {TABS.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={`${sh.chip} ${path === t.to ? sh.chipActive : ""}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
