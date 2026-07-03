import { useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import sh from "../adminShared.module.css";

const ORDERS = [
  { no: "K00231", user: "홍길동", amt: 34860, paid: "결제완료", ship: "배송준비" },
  { no: "K00232", user: "김철수", amt: 129000, paid: "결제완료", ship: "배송중" },
  { no: "K00233", user: "이영희", amt: 12500, paid: "결제완료", ship: "배송완료" },
  { no: "K00234", user: "박민수", amt: 8900, paid: "결제대기", ship: "-" },
  { no: "K00235", user: "최유나", amt: 45200, paid: "취소", ship: "취소" },
];
const TABS = ["전체", "배송준비", "배송중", "배송완료", "취소"];

function shipBadge(s: string) {
  if (s === "배송완료") return sh.bOk;
  if (s === "배송중") return sh.bInfo;
  if (s === "취소") return sh.bDanger;
  if (s === "배송준비") return sh.bWarn;
  return sh.bMuted;
}

export function AdminOrdersPage() {
  const [tab, setTab] = useState("전체");
  const rows = tab === "전체" ? ORDERS : ORDERS.filter((o) => o.ship === tab);

  return (
    <AdminLayout title="주문 · 배송 관리">
      <div className={sh.toolbar}>
        <div className={sh.filters}>
          {TABS.map((t) => (
            <button key={t} className={`${sh.chip} ${tab === t ? sh.chipActive : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={sh.list}>
        {rows.map((o) => (
          <Card key={o.no}>
            <div className={sh.itemHead}>
              <span className={sh.itemTitle}>{o.no}</span>
              <span className={`${sh.badge} ${shipBadge(o.ship)}`}>{o.ship}</span>
            </div>
            <div className={sh.itemBottom}>
              <span className={sh.itemMetaInline}>
                {o.user} · ₩{o.amt.toLocaleString()} · {o.paid}
              </span>
              {(o.ship === "배송준비" || o.ship === "배송중") && (
                <Button variant="ghost" size="sm">
                  {o.ship === "배송준비" ? "발송 처리" : "배송완료"}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
