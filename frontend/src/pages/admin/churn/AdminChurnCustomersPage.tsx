import { useEffect, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { ChurnSubnav } from "../../../components/ChurnSubnav";
import { Card } from "../../../components/Card";
import { getRiskCustomers, type RiskCustomer } from "../../../api/adminChurn";
import sh from "../adminShared.module.css";

// 위험 등급 코드 → 라벨
const LEVEL_LABEL: Record<string, string> = { HIGH: "고위험", MID: "중위험", LOW: "저위험" };

// 대응 상태 코드 → 라벨·뱃지
const STATUS_LABEL: Record<string, string> = { SCHEDULED: "예정", SENT: "발송됨", CONTROL: "대조군" };
function statusBadge(s: string) {
  if (s === "SENT") return sh.bOk;
  if (s === "SCHEDULED") return sh.bWarn;
  return sh.bMuted; // CONTROL
}

// 위험 유형 코드 → 라벨 + 추천 대응
const RISK_TYPE_LABEL: Record<string, string> = {
  CART_ABANDON: "장바구니 방치",
  MEMBERSHIP_CANCEL: "멤버십 해지",
  FIRST_ORDER_ONLY: "첫구매 미복귀",
  WISHLIST_IDLE: "찜 방치",
  COUPON_EXPIRING: "쿠폰 만료임박",
  BAD_EXPERIENCE: "부정경험",
  LOGIN_INACTIVE: "접속 뜸",
  SPENDING_DROP: "구매액 감소",
  ML_HIGH: "ML 고위험",
};
const SUGGESTED_ACTION: Record<string, string> = {
  CART_ABANDON: "리마인더",
  MEMBERSHIP_CANCEL: "만류 쿠폰",
  FIRST_ORDER_ONLY: "웰컴백 쿠폰",
  WISHLIST_IDLE: "찜 할인 알림",
  COUPON_EXPIRING: "만료 알림",
  BAD_EXPERIENCE: "사과 쿠폰",
  LOGIN_INACTIVE: "복귀 혜택",
  SPENDING_DROP: "재구매 알림",
  ML_HIGH: "맞춤 대응",
};

// 필터 탭 라벨 ↔ 서버 파라미터
const TYPE_TABS = [
  { label: "전체", value: undefined },
  { label: "일반", value: "NORMAL" },
  { label: "멤버십", value: "MEMBER" },
];
const LEVEL_TABS = [
  { label: "전체", value: undefined },
  { label: "고위험", value: "HIGH" },
  { label: "중위험", value: "MID" },
];

function scoreColor(s: number) {
  return s >= 0.7 ? "var(--color-danger)" : s >= 0.4 ? "var(--color-warning)" : "var(--color-success)";
}

export function AdminChurnCustomersPage() {
  const [type, setType] = useState("전체");
  const [level, setLevel] = useState("전체");
  const [rows, setRows] = useState<RiskCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 필터가 바뀔 때마다 서버 재조회
  useEffect(() => {
    const memberType = TYPE_TABS.find((t) => t.label === type)?.value;
    const levelValue = LEVEL_TABS.find((l) => l.label === level)?.value;
    setLoading(true);
    setError(false);
    getRiskCustomers({ memberType, level: levelValue, size: 100 })
      .then((data) => {
        setRows(data.content);
        setTotal(data.totalElements);
      })
      .catch((err) => {
        console.error("위험 고객 목록을 불러오지 못했습니다.", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [type, level]);

  return (
    <AdminLayout title="위험 고객 목록">
      <ChurnSubnav />

      <div className={sh.toolbar}>
        <div className={sh.filters}>
          {TYPE_TABS.map((t) => (
            <button
              key={t.label}
              className={`${sh.chip} ${type === t.label ? sh.chipActive : ""}`}
              onClick={() => setType(t.label)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className={sh.filters}>
          {LEVEL_TABS.map((l) => (
            <button
              key={l.label}
              className={`${sh.chip} ${level === l.label ? sh.chipActive : ""}`}
              onClick={() => setLevel(l.label)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className={sh.itemMeta}>불러오는 중…</p>
      ) : error ? (
        <p className={sh.itemMeta}>목록을 불러오지 못했습니다.</p>
      ) : rows.length === 0 ? (
        <p className={sh.itemMeta}>해당 조건의 위험 고객이 없습니다.</p>
      ) : (
        <>
          <p className={sh.itemMeta}>총 {total.toLocaleString()}명</p>
          <div className={sh.list}>
            {rows.map((c) => (
              <Card key={c.userId}>
                <div className={sh.itemHead}>
                  <span className={sh.itemTitle}>
                    {c.name}{" "}
                    <span className={`${sh.badge} ${c.isMember ? sh.bInfo : sh.bMuted}`}>
                      {c.isMember ? "멤버십" : "일반"}
                    </span>
                  </span>
                  <strong style={{ color: scoreColor(c.score) }}>
                    {LEVEL_LABEL[c.riskLevel] ?? c.riskLevel} {c.score.toFixed(2)}
                  </strong>
                </div>
                <div className={sh.itemBottom}>
                  <span className={sh.itemMetaInline}>
                    {RISK_TYPE_LABEL[c.riskType] ?? c.riskType} → {SUGGESTED_ACTION[c.riskType] ?? "대응"}
                  </span>
                  <span className={`${sh.badge} ${statusBadge(c.status)}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
