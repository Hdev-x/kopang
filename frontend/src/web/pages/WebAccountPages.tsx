import { useEffect, useState } from "react";
import { ChevronRight, Download, Heart, MapPin, Package, Search, Star, Ticket, UserRound, Eye, EyeOff } from "lucide-react";
import { updateProfile } from "../../api/auth";
import { getAvailableCoupons, getMyCoupons, downloadCoupon, type CouponResponse, type UserCouponResponse } from "../../api/coupon";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebAccountPages.module.css";

type AccountKind = "home" | "profile" | "notifications" | "password" | "orders" | "order" | "addresses" | "wishlist" | "points" | "coupons" | "inquiries" | "inquiry" | "reviews" | "review-write";
const SHOPPING_NAV = [{ to: "/web/my/orders", label: "주문배송목록" }, { to: "/web/my/wishlist", label: "찜한 상품" }, { to: "/web/my/inquiries", label: "나의문의내역" }, { to: "/web/my/points", label: "포인트" }, { to: "/web/my/coupons", label: "쿠폰" }];
const REVIEW_NAV = [{ to: "/web/my/reviews/write", label: "리뷰 남기기" }, { to: "/web/my/reviews", label: "내가 남긴 리뷰" }];
const SETTING_NAV = [{ to: "/web/my/profile", label: "회원정보 수정" }, { to: "/web/my/notifications", label: "알림 설정" }, { to: "/web/my/addresses", label: "배송지 설정" }, { to: "/web/my/password", label: "비밀번호 변경" }];
const SETTING_KINDS: AccountKind[] = ["profile", "notifications", "password", "addresses"];

export function WebAccountPage({ kind }: { kind: AccountKind }) {
  const user = useAuth();
  const { no, id } = useParams();
  const setting = SETTING_KINDS.includes(kind);
  const review = kind === "reviews" || kind === "review-write";
  const shopping = ["orders", "order", "wishlist", "points", "coupons", "inquiries", "inquiry"].includes(kind);
  const tabs = review ? REVIEW_NAV : setting ? SETTING_NAV : [];

  return <WebLayout>
    {shopping ? <WebShoppingNav activeKind={kind} /> : tabs.length > 0 && <nav className={styles.localNav}>{tabs.map((item) => <Link key={item.to} to={item.to} className={isActive(kind, item.to) ? styles.active : ""}>{item.label}</Link>)}</nav>}
    {kind === "home" ? <ProfileHome name={user?.name ?? "Kopang 사용자"} /> : review ? <ReviewPage write={kind === "review-write"} /> : setting ? <SettingsBody kind={kind} name={user?.name ?? ""} /> : kind === "coupons" ? <WebCouponsTab /> : <ShoppingPage kind={kind} suffix={kind === "order" ? no : kind === "inquiry" ? id : undefined} />}
  </WebLayout>;
}

export function WebShoppingNav({ activeKind }: { activeKind: string }) {
  return <nav className={styles.localNav}>{SHOPPING_NAV.map((item) => <Link key={item.to} to={item.to} className={isActive(activeKind as AccountKind, item.to) ? styles.active : ""}>{item.label}</Link>)}</nav>;
}

function ProfileHome({ name }: { name: string }) {
  return <div className={styles.profileLayout}><aside className={styles.profileCard}><div className={styles.avatar}><UserRound size={42} /></div><h1>{name}</h1><div className={styles.profileStats}><span><Heart />찜<b>0</b></span><span><Ticket />쿠폰<b>0</b></span><span><Package />주문<b>0</b></span></div></aside><main className={styles.profileContent}><section><h2>찜한 상품</h2><div className={styles.uploadEmpty}>관심 상품을 저장하면 여기에 표시됩니다.</div></section></main></div>;
}

function ReviewPage({ write }: { write: boolean }) {
  return <main className={styles.reviewPage}>{write ? <><h1>내가 사용한 상품 리뷰쓰기</h1><div className={styles.reviewSearch}><input placeholder="브랜드명 혹은 상품명 입력" /><button type="button"><Search size={18} />검색</button></div><div className={styles.empty}><Star size={36} /><strong>작성 가능한 리뷰가 없어요.</strong><p>구매 확정된 상품이 생기면 리뷰를 작성할 수 있어요.</p></div></> : <div className={styles.empty}><Star size={36} /><strong>내가 남긴 리뷰가 없어요.</strong><p>상품을 사용한 경험을 다른 사용자와 공유해 보세요.</p></div>}</main>;
}

function SettingsPage({ name }: { name: string }) {
  return <main className={styles.settings}><div className={styles.avatar}><UserRound size={34} /></div><h1>회원정보 수정</h1><label>닉네임<input defaultValue={name} /></label><label>이메일<input value="로그인 계정에서 제공되는 정보" disabled readOnly /></label><label>휴대폰 번호<button type="button">내 번호 인증하기</button></label><label>생년월일<input type="date" /></label><button type="button" className={styles.save}>저장하기</button></main>;
}

function ShoppingPage({ kind, suffix }: { kind: AccountKind; suffix?: string }) {
  const titleMap: Partial<Record<AccountKind, string>> = { orders: "주문배송목록", order: `주문 상세 #${suffix ?? ""}`, addresses: "배송지 관리", wishlist: "상품 스크랩북", points: "포인트", coupons: "쿠폰", inquiries: "나의 문의내역", inquiry: `문의 상세 #${suffix ?? ""}` };
  return <main className={styles.shopping}><section className={styles.summary}><span><Ticket />쿠폰 <b>0</b></span><span><Star />포인트 <b>0P</b></span><span><Package />진행 중인 주문 <b>0</b></span></section><h1>{titleMap[kind] ?? "나의 쇼핑"}</h1><div className={styles.orderSteps}>{["입금대기", "결제완료", "배송준비", "배송중", "배송완료", "구매확정"].map((step, index) => <span key={step}>{step}<b>0</b>{index < 5 && <ChevronRight />}</span>)}</div><div className={styles.empty}><Package size={36} /><strong>표시할 내역이 없어요.</strong><p>실제 API가 연결되면 이 영역에 최신 내역이 표시됩니다.</p></div></main>;
}

function SettingsBody({ kind, name }: { kind: AccountKind; name: string }) {
  if (kind === "notifications") return <NotificationSettings />;
  if (kind === "password") return <PasswordChange />;
  if (kind === "addresses") return <AddressBook />;
  return <SettingsPage name={name} />;
}

function NotificationSettings() {
  const rows = [
    { key: "order", label: "주문·배송 알림", desc: "주문 상태와 배송 진행 상황을 알려드려요.", on: true },
    { key: "benefit", label: "혜택·쿠폰 알림", desc: "쿠폰 도착과 할인 소식을 받아요.", on: true },
    { key: "email", label: "마케팅 정보 수신 (이메일)", desc: "이벤트·추천 상품 소식을 이메일로 받아요.", on: false },
    { key: "sms", label: "마케팅 정보 수신 (SMS)", desc: "이벤트·추천 상품 소식을 문자로 받아요.", on: false },
  ];
  return (
    <main className={styles.prefList}>
      <h1>알림 설정</h1>
      {rows.map((r) => (
        <PrefToggle key={r.key} label={r.label} desc={r.desc} defaultOn={r.on} />
      ))}
    </main>
  );
}

function PrefToggle({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className={styles.prefRow}>
      <div>
        <b>{label}</b>
        <small>{desc}</small>
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label={label} className={styles.switch} onClick={() => setOn((v) => !v)} />
    </div>
  );
}

function PasswordChange() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      window.alert("새 비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      window.alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setSubmitting(true);
      await updateProfile({ password: newPassword });
      window.alert("비밀번호가 성공적으로 변경되었습니다.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err.response?.data?.message || "비밀번호 변경에 실패했습니다.";
      window.alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.settings}>
      <h1>비밀번호 변경</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "400px" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500 }}>새 비밀번호</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8자 이상 입력"
              autoComplete="new-password"
              required
              style={{
                width: "100%",
                padding: "10px 40px 10px 12px",
                border: "1px solid var(--color-border, #ddd)",
                borderRadius: "6px",
                outline: "none"
              }}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={{
                position: "absolute",
                right: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#888",
                zIndex: 2,
                padding: 0
              }}
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "14px", fontWeight: 500 }}>새 비밀번호 확인</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호 다시 입력"
              autoComplete="new-password"
              required
              style={{
                width: "100%",
                padding: "10px 40px 10px 12px",
                border: "1px solid var(--color-border, #ddd)",
                borderRadius: "6px",
                outline: "none"
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#888",
                zIndex: 2,
                padding: 0
              }}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={submitting} className={styles.save} style={{ height: "45px", marginTop: "10px" }}>
          {submitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </main>
  );
}

function AddressBook() {
  return (
    <main className={styles.shopping}>
      <h1>배송지 관리</h1>
      <div className={styles.empty}>
        <MapPin size={36} />
        <strong>등록된 배송지가 없어요.</strong>
        <p>자주 쓰는 배송지를 등록해두면 주문이 빨라져요.</p>
        <button type="button" className={styles.addBtn}>새 배송지 추가</button>
      </div>
    </main>
  );
}

function WebCouponsTab() {
  const [loading, setLoading] = useState(true);
  const [myCoupons, setMyCoupons] = useState<UserCouponResponse[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<CouponResponse[]>([]);

  const loadData = async () => {
    try {
      const [myData, availableData] = await Promise.all([
        getMyCoupons(),
        getAvailableCoupons(),
      ]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const validMy = myData.filter((c) => {
        if (c.used) return false;
        if (!c.expiresAt) return true;
        return new Date(c.expiresAt) >= today;
      });
      setMyCoupons(validMy);
      setAvailableCoupons(availableData);
    } catch (err) {
      console.error("웹 쿠폰 데이터 로드 실패", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownload = async (couponId: number) => {
    try {
      await downloadCoupon(couponId);
      window.alert("쿠폰이 다운로드되어 쿠폰함에 발급되었습니다!");
      loadData();
    } catch (err: any) {
      window.alert(err.response?.data?.message || "이미 다운로드받았거나 소진된 쿠폰입니다.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `~ ${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <main className={styles.shopping}>
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted, #888)" }}>
          쿠폰 정보를 불러오는 중...
        </div>
      </main>
    );
  }

  return (
    <main className={styles.shopping}>
      <section className={styles.summary}>
        <span><Ticket />사용 가능 쿠폰 <b>{myCoupons.length}장</b></span>
        <span><Download />다운로드 가능 쿠폰 <b>{availableCoupons.length}장</b></span>
      </section>

      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Ticket size={20} color="var(--color-primary, #007bff)" />
          보유 중인 쿠폰 ({myCoupons.length})
        </h2>
        {myCoupons.length === 0 ? (
          <div className={styles.empty} style={{ minHeight: "140px", border: "1px dashed var(--color-border, #ddd)", borderRadius: "8px" }}>
            보유 중인 미사용 쿠폰이 없습니다.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {myCoupons.map((c) => (
              <div
                key={c.userCouponId}
                style={{
                  border: "1px solid var(--color-border, #eee)",
                  borderRadius: "12px",
                  padding: "20px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", backgroundColor: "var(--color-primary, #007bff)" }} />
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#333" }}>{c.name}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#007bff", backgroundColor: "#e6f0ff", padding: "4px 8px", borderRadius: "4px" }}>
                      {c.discountType === "RATE" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}원`}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#666", margin: "4px 0 12px" }}>
                    {c.discountType === "RATE" ? "결제 금액 비율 할인" : "정액 할인 쿠폰"}
                  </p>
                </div>
                <div style={{ fontSize: "12px", color: "#888", borderTop: "1px solid #f0f0f0", paddingTop: "10px", marginTop: "10px" }}>
                  유효기간: {formatDate(c.expiresAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "var(--color-primary, #007bff)", display: "flex", alignItems: "center", gap: "8px" }}>
          🔥 쿠폰 다운로드 존
        </h2>
        {availableCoupons.length === 0 ? (
          <div className={styles.empty} style={{ minHeight: "140px" }}>
            다운로드 가능한 쿠폰이 없습니다.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {availableCoupons.map((c) => {
              const isDownloaded = myCoupons.some((mc) => mc.couponId === c.couponId);
              return (
                <div
                  key={c.couponId}
                  style={{
                    border: "1px solid var(--color-border, #eee)",
                    borderRadius: "12px",
                    padding: "20px",
                    backgroundColor: "#fafafa",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "16px", fontWeight 700, color: "#333", display: "block", marginBottom: "6px" }}>{c.name}</span>
                    <span style={{ fontSize: "12px", color: "#888" }}>
                      선착순 잔여: {c.quantity.toLocaleString()}개 | {formatDate(c.endDate)} 만료
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isDownloaded}
                    onClick={() => handleDownload(c.couponId)}
                    style={{
                      marginTop: "16px",
                      height: "40px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: isDownloaded ? "#ccc" : "var(--color-primary, #007bff)",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: isDownloaded ? "default" : "pointer"
                    }}
                  >
                    {isDownloaded ? "발급 완료" : "다운로드"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function isActive(kind: AccountKind, to: string) {
  if (kind === "reviews") return to.endsWith("/reviews");
  if (kind === "review-write") return to.endsWith("/write");
  const value = to.split("/").pop();
  return kind === value || (kind === "order" && value === "orders") || (kind === "inquiry" && value === "inquiries");
}
