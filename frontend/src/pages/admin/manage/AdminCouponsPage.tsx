import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { SkeletonRows } from "../../../components/Skeleton";
import { getAdminCoupons, createAdminCoupon, type AdminCouponResponse } from "../../../api/admin";
import styles from "./AdminCouponsPage.module.css";

export function AdminCouponsPage() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<AdminCouponResponse[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"RATE" | "AMOUNT">("AMOUNT");
  const [discountValue, setDiscountValue] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [endDate, setEndDate] = useState("");

  const loadData = async () => {
    try {
      setCoupons(await getAdminCoupons());
    } catch (err) {
      console.error("쿠폰 현황을 불러오는 데 실패했습니다.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("쿠폰명을 입력해 주세요.");
    const val = parseInt(discountValue);
    if (isNaN(val) || val <= 0) return alert("올바른 할인 수치를 입력해 주세요.");
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return alert("올바른 수량을 입력해 주세요.");

    try {
      await createAdminCoupon({ name, discountType, discountValue: val, quantity: qty, endDate: endDate || undefined });
      alert("새 쿠폰 정책이 성공적으로 등록되었습니다!");
      setModalOpen(false);
      setName(""); setDiscountValue(""); setQuantity("1000"); setEndDate("");
      loadData();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      alert(message ?? "쿠폰 생성에 실패했습니다.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `~ ${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <AdminLayout title="쿠폰 · 이벤트 관리" fullBleed>
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <span className={styles.caption}>이탈 대응 쿠폰은 대상(target)으로 연결</span>
          <div className={styles.spacer} />
          <button className={styles.createBtn} onClick={() => setModalOpen(true)}><Plus size={15} /> 쿠폰 생성</button>
        </div>

        {loading ? (
          <div className={styles.tableWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr><th>쿠폰명</th><th>대상</th><th>할인</th><th className={styles.r}>발급</th><th className={styles.r}>사용률</th><th className={styles.r}>재고</th><th>만료</th></tr>
              </thead>
              <tbody><SkeletonRows rows={10} cols={7} widths={["70%", "50%", "44%", "40%", "56%", "38%", "60%"]} /></tbody>
            </table>
          </div>
        ) : coupons.length === 0 ? (
          <p className={styles.empty}>생성된 쿠폰 정책이 없습니다.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr><th>쿠폰명</th><th>대상</th><th>할인</th><th className={styles.r}>발급</th><th className={styles.r}>사용률</th><th className={styles.r}>재고</th><th>만료</th></tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const usageRate = c.issuedCount > 0 ? Math.round((c.usedCount / c.issuedCount) * 100) : 0;
                  return (
                    <tr key={c.couponId}>
                      <td className={styles.name}>{c.name}</td>
                      <td><span className={`${styles.badge} ${c.targetGroup === "신규" ? styles.bMuted : styles.bInfo}`}>{c.targetGroup}</span></td>
                      <td>{c.discountType === "RATE" ? `${c.discountValue}%` : `₩${c.discountValue.toLocaleString()}`}</td>
                      <td className={styles.r}>{c.issuedCount.toLocaleString()}</td>
                      <td className={styles.r}>
                        <span className={styles.usage}>
                          <span className={styles.usageTrack}><span className={styles.usageFill} style={{ width: `${usageRate}%` }} /></span>
                          {usageRate}%
                        </span>
                      </td>
                      <td className={styles.r}>{c.quantity.toLocaleString()}</td>
                      <td>{formatDate(c.endDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>신규 쿠폰 생성</h3>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form className={styles.form} onSubmit={handleCreateCoupon}>
              <div className={styles.field}>
                <label>쿠폰명</label>
                <input type="text" placeholder="예: 웰컴 컴백 쿠폰 10%" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>할인 방식</label>
                <div className={styles.radioRow}>
                  <label><input type="radio" name="discountType" checked={discountType === "AMOUNT"} onChange={() => setDiscountType("AMOUNT")} />정액 (원)</label>
                  <label><input type="radio" name="discountType" checked={discountType === "RATE"} onChange={() => setDiscountType("RATE")} />정률 (%)</label>
                </div>
              </div>
              <div className={styles.field}>
                <label>{discountType === "AMOUNT" ? "할인 금액 (원)" : "할인 비율 (%)"}</label>
                <input type="number" min={1} max={discountType === "RATE" ? 100 : undefined} placeholder={discountType === "AMOUNT" ? "예: 3000" : "예: 10"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>발급 수량 (선착순 재고)</label>
                <input type="number" min={1} placeholder="예: 1000" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>만료 일자</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnGhost} onClick={() => setModalOpen(false)}>취소</button>
                <button type="submit" className={styles.btnPrimary}>생성하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
