import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { getAvailableCoupons, getMyCoupons, downloadCoupon, type CouponResponse, type UserCouponResponse } from "../../api/coupon";
import { useAuth } from "../../hooks/useAuth";
import s from "../../styles/AccountPages.module.css";

export function CouponPage() {
  const user = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [myCoupons, setMyCoupons] = useState<UserCouponResponse[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<CouponResponse[]>([]);

  // 실시간 쿠폰 데이터 로드
  const loadCouponData = async () => {
    try {
      const myData = await getMyCoupons();
      const availableData = await getAvailableCoupons();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 미사용 및 미만료(당일 자정 기준 포함) 쿠폰 위주로 필터링
      setMyCoupons(
        myData.filter((c) => {
          if (c.used) return false;
          if (!c.expiresAt) return true;
          return new Date(c.expiresAt) >= today;
        })
      );
      setAvailableCoupons(availableData);
    } catch (err) {
      console.error("쿠폰 정보를 불러오지 못했습니다.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    loadCouponData();
  }, [user]);

  // 로그인 체크 게이트
  if (!user) {
    return (
      <Layout>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px",
          textAlign: "center"
        }}>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>로그인이 필요한 페이지예요.</p>
          <Button onClick={() => navigate("/login")}>로그인하러 가기</Button>
        </div>
      </Layout>
    );
  }

  // 쿠폰 다운로드 처리
  const handleDownload = async (couponId: number) => {
    try {
      await downloadCoupon(couponId);
      alert("쿠폰이 다운로드되어 쿠폰함에 추가되었습니다!");
      loadCouponData();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      alert(err.response?.data?.message || "이미 다운로드받았거나 소진된 쿠폰입니다.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader title="쿠폰함" />
        <div style={{ textAlign: "center", padding: "80px", color: "var(--color-text-muted)" }}>로딩 중...</div>
      </Layout>
    );
  }

  // 날짜 형식
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `~ ${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <Layout>
      <PageHeader title="쿠폰함" />

      {/* 보유 쿠폰 목록 */}
      <h3 className={s.section} style={{ margin: "20px 0 10px", fontSize: "var(--font-md, 16px)" }}>보유 중인 쿠폰 ({myCoupons.length})</h3>
      <div className={s.list}>
        {myCoupons.length === 0 ? (
          <div className={s.empty} style={{ border: "1px solid var(--color-border, #eee)", borderRadius: "var(--radius-md, 8px)" }}>보유 중인 미사용 쿠폰이 없습니다.</div>
        ) : (
          myCoupons.map((c) => (
            <Card key={c.userCouponId}>
              <div className={s.coupon}>
                <div className={s.col}>
                  <span className={s.couponName}>{c.name}</span>
                  <span className={s.muted}>
                    {c.discountType === "RATE" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}원`} 할인
                  </span>
                </div>
                <span className={s.muted} style={{ fontSize: "var(--font-sm, 14px)" }}>{formatDate(c.expiresAt)}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 쿠폰 다운로드 존 */}
      <h3 className={s.section} style={{ margin: "40px 0 10px", fontSize: "var(--font-md, 16px)", color: "var(--color-primary)" }}>🔥 쿠폰 다운로드 존</h3>
      <div className={s.list} style={{ marginBottom: "40px" }}>
        {availableCoupons.length === 0 ? (
          <div className={s.empty}>다운로드 가능한 쿠폰이 없습니다.</div>
        ) : (
          availableCoupons.map((c) => {
            // 내가 이미 받았는지 확인
            const isAlreadyDownloaded = myCoupons.some((mc) => mc.couponId === c.couponId);

            return (
              <Card key={c.couponId}>
                <div className={s.row} style={{ alignItems: "center" }}>
                  <div className={s.col} style={{ flex: 1 }}>
                    <span className={s.couponName} style={{ fontWeight: "var(--weight-bold, 700)" }}>{c.name}</span>
                    <span className={s.muted} style={{ fontSize: "var(--font-xs, 12px)" }}>
                      선착순 잔여: {c.quantity.toLocaleString()}개 | {formatDate(c.endDate)} 만료
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={isAlreadyDownloaded}
                    onClick={() => handleDownload(c.couponId)}
                    style={{
                      backgroundColor: isAlreadyDownloaded ? "var(--gray-300, #ccc)" : "var(--color-primary)",
                      color: "#fff",
                      fontSize: "var(--font-xs, 12px)",
                      padding: "8px 12px"
                    }}
                  >
                    {isAlreadyDownloaded ? "발급 완료" : "받기"}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Layout>
  );
}
