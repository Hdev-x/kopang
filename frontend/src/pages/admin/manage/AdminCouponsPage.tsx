import { Plus } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import sh from "../adminShared.module.css";

const COUPONS = [
  { name: "이탈방지 5천원", type: "정액", value: "₩5,000", period: "~07-31", issued: 412, used: 128, target: "위험고객" },
  { name: "멤버십 유지 10%", type: "정률", value: "10%", period: "~08-15", issued: 80, used: 41, target: "멤버십 해지위험" },
  { name: "재구매 3천원", type: "정액", value: "₩3,000", period: "~07-20", issued: 220, used: 64, target: "주기단절" },
  { name: "신규가입 환영", type: "정액", value: "₩2,000", period: "상시", issued: 1500, used: 980, target: "신규" },
];

export function AdminCouponsPage() {
  return (
    <AdminLayout title="쿠폰 · 이벤트 관리">
      <div className={sh.toolbar}>
        <span className={sh.muted}>이탈 대응 쿠폰은 대상(target)으로 연결</span>
        <div className={sh.spacer} />
        <Button size="sm">
          <Plus size={15} /> 쿠폰 발급
        </Button>
      </div>

      <div className={sh.list}>
        {COUPONS.map((c) => (
          <Card key={c.name}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>{c.name}</span>
              <span className={`${sh.badge} ${c.target === "신규" ? sh.bMuted : sh.bInfo}`}>{c.target}</span>
            </div>
            <p className={sh.itemMeta}>
              {c.type} {c.value} · {c.period}
            </p>
            <p className={sh.itemMeta}>
              발급 {c.issued.toLocaleString()} · 사용 {c.used.toLocaleString()} (
              {Math.round((c.used / c.issued) * 100)}%)
            </p>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
