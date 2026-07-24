import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { getAdminCoupons, createAdminCoupon, type AdminCouponResponse } from "../../../api/admin";
import sh from "../adminShared.module.css";

export function AdminCouponsPage() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<AdminCouponResponse[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // 입력 폼 상태
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"RATE" | "AMOUNT">("AMOUNT");
  const [discountValue, setDiscountValue] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [endDate, setEndDate] = useState("");

  const loadData = async () => {
    try {
      const data = await getAdminCoupons();
      setCoupons(data);
    } catch (err) {
      console.error("쿠폰 현황을 불러오는 데 실패했습니다.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("쿠폰명을 입력해 주세요.");
      return;
    }
    const val = parseInt(discountValue);
    if (isNaN(val) || val <= 0) {
      alert("올바른 할인 수치를 입력해 주세요.");
      return;
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("올바른 수량을 입력해 주세요.");
      return;
    }

    try {
      await createAdminCoupon({
        name,
        discountType,
        discountValue: val,
        quantity: qty,
        endDate: endDate ? endDate : undefined,
      });
      alert("새 쿠폰 정책이 성공적으로 등록되었습니다!");
      setModalOpen(false);
      // 폼 초기화
      setName("");
      setDiscountValue("");
      setQuantity("1000");
      setEndDate("");
      loadData(); // 재로드
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      alert(message ?? "쿠폰 생성에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="쿠폰 · 이벤트 관리">
        <div style={{ textAlign: "center", padding: "80px", color: "var(--color-text-muted)" }}>로딩 중...</div>
      </AdminLayout>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `~ ${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <AdminLayout title="쿠폰 · 이벤트 관리">
      <div className={sh.toolbar}>
        <span className={sh.muted}>이탈 대응 쿠폰은 대상(target)으로 연결</span>
        <div className={sh.spacer} />
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> 쿠폰 생성
        </Button>
      </div>

      <div className={sh.list}>
        {coupons.length === 0 ? (
          <div className={sh.empty}>생성된 쿠폰 정책이 없습니다.</div>
        ) : (
          coupons.map((c) => {
            const usageRate = c.issuedCount > 0 ? Math.round((c.usedCount / c.issuedCount) * 100) : 0;
            return (
              <Card key={c.couponId}>
                <div className={sh.itemHead}>
                  <span className={sh.itemTitle}>{c.name}</span>
                  <span className={`${sh.badge} ${c.targetGroup === "신규" ? sh.bMuted : sh.bInfo}`}>
                    {c.targetGroup}
                  </span>
                </div>
                <p className={sh.itemMeta}>
                  {c.discountType === "RATE" ? "정률" : "정액"} {" "}
                  {c.discountType === "RATE" ? `${c.discountValue}%` : `₩${c.discountValue.toLocaleString()}`} · {formatDate(c.endDate)}
                </p>
                <p className={sh.itemMeta}>
                  발급 {c.issuedCount.toLocaleString()}건 · 사용 {c.usedCount.toLocaleString()}건 ({usageRate}%) · 재고 {c.quantity.toLocaleString()}개
                </p>
              </Card>
            );
          })
        )}
      </div>

      {/* 쿠폰 생성 모달 팝업 */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }} onClick={() => setModalOpen(false)}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "var(--radius-lg, 12px)",
            width: "100%",
            maxWidth: "450px",
            padding: "24px",
            boxShadow: "var(--shadow-lg)",
            position: "relative"
          }} onClick={(e) => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>신규 쿠폰 생성</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)" }}>쿠폰명</label>
                <input
                  type="text"
                  placeholder="예: 웰컴 컴백 쿠폰 10%"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--color-border, #eee)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)" }}>할인 방식</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="discountType"
                      checked={discountType === "AMOUNT"}
                      onChange={() => setDiscountType("AMOUNT")}
                    />
                    정액 (원)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="discountType"
                      checked={discountType === "RATE"}
                      onChange={() => setDiscountType("RATE")}
                    />
                    정률 (%)
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)" }}>
                  {discountType === "AMOUNT" ? "할인 금액 (원)" : "할인 비율 (%)"}
                </label>
                <input
                  type="number"
                  min={1}
                  max={discountType === "RATE" ? 100 : undefined}
                  placeholder={discountType === "AMOUNT" ? "예: 3000" : "예: 10"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--color-border, #eee)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)" }}>발급 수량 (선착순 재고)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="예: 1000"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--color-border, #eee)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)" }}>만료 일자</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--color-border, #eee)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <Button type="button" variant="ghost" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>취소</Button>
                <Button type="submit" style={{ flex: 1 }}>생성하기</Button>
              </div>
            </form>

          </div>
        </div>
      )}
    </AdminLayout>
  );
}
