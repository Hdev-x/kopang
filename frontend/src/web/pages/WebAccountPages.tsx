import { useEffect, useState, useRef } from "react";
import { ChevronRight, Download, Heart, Image, Package, Ticket, UserRound, Eye, EyeOff } from "lucide-react";
import { getProfile, updateProfile } from "../../api/auth";
import { getAvailableCoupons, getMyCoupons, downloadCoupon, type CouponResponse, type UserCouponResponse } from "../../api/coupon";
import { getPointBalance } from "../../api/point";
import { formatOrderStatus, getOrders, type Order } from "../../api/order";
import { getWishlist, type Wishlist } from "../../api/wishlist";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/error";
import { WebLayout } from "../components/WebLayout";
import { WebMyInquiriesPage, WebMyInquiryDetailPage, WebOrderDetailPage, WebOrdersPage, WebReviewsPage, WebWishlistPage } from "./WebShoppingAccountPages";
import { WebAddressBook } from "./WebAddressBook";
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
    {kind === "home" ? <ProfileHome name={user?.name ?? "Kopang 사용자"} /> : kind === "orders" ? <WebOrdersPage /> : kind === "order" ? <WebOrderDetailPage orderId={no} /> : kind === "wishlist" ? <WebWishlistPage /> : kind === "inquiries" ? <WebMyInquiriesPage /> : kind === "inquiry" ? <WebMyInquiryDetailPage inquiryId={id} /> : review ? <WebReviewsPage write={kind === "review-write"} /> : setting ? <SettingsBody kind={kind} name={user?.name ?? ""} /> : kind === "coupons" ? <WebCouponsTab /> : <WebOrdersPage />}
  </WebLayout>;
}

export function WebShoppingNav({ activeKind }: { activeKind: string }) {
  return <nav className={styles.localNav}>{SHOPPING_NAV.map((item) => <Link key={item.to} to={item.to} className={isActive(activeKind as AccountKind, item.to) ? styles.active : ""}>{item.label}</Link>)}</nav>;
}

function ProfileHome({ name }: { name: string }) {
  const [couponsCount, setCouponsCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<Wishlist[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyCoupons().catch(() => []),
      getOrders().catch(() => []),
      getWishlist().catch(() => []),
      getPointBalance().catch(() => ({ balance: 0 })),
    ]).then(([couponData, orderData, wishlistData, pointData]) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const validCoupons = couponData.filter((c) => {
        if (c.used) return false;
        if (!c.expiresAt) return true;
        return new Date(c.expiresAt) >= today;
      });
      setCouponsCount(validCoupons.length);
      setOrders(orderData);
      setWishlist(wishlistData);
      setPoints(pointData.balance);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.profileLayout}>
      <aside className={styles.profileCard}>
        <div className={styles.avatar}>
          <UserRound size={42} />
        </div>
        <h1>{name}</h1>
        <p>반가워요. 오늘의 쇼핑 현황을 확인해 보세요.</p>
        <Link to="/web/my/profile">회원정보 관리</Link>
        <div className={styles.profileStats}>
          <Link to="/web/my/wishlist" className={styles.statLink}>
            <span><Heart />찜<b>{wishlist.length}</b></span>
          </Link>
          <Link to="/web/my/coupons" className={styles.statLink}>
            <span><Ticket />쿠폰<b>{couponsCount}</b></span>
          </Link>
          <Link to="/web/my/orders" className={styles.statLink}>
            <span><Package />주문<b>{orders.length}</b></span>
          </Link>
        </div>
      </aside>
      <main className={styles.profileContent}>
        <section className={styles.dashboardSummary}>
          <Link to="/web/membership"><span>KOPANG MEMBERSHIP</span><strong>멤버십 혜택 확인</strong><ChevronRight /></Link>
          <Link to="/web/my/points"><span>사용 가능 포인트</span><strong>{points.toLocaleString()}P</strong><ChevronRight /></Link>
          <Link to="/web/my/coupons"><span>사용 가능 쿠폰</span><strong>{couponsCount}장</strong><ChevronRight /></Link>
        </section>
        <section>
          <header className={styles.sectionHeading}><h2>최근 주문</h2><Link to="/web/my/orders">전체보기 <ChevronRight /></Link></header>
          {loading ? <div className={styles.uploadEmpty}>쇼핑 정보를 불러오는 중이에요.</div> : orders.length === 0 ? <div className={styles.uploadEmpty}>아직 주문한 상품이 없어요.</div> : (
            <div className={styles.recentOrders}>{orders.slice(0, 2).map((order) => <Link key={order.orderId} to={`/web/my/orders/${order.orderId}`}><Package /><div><strong>{order.items[0]?.name ?? `주문 #${order.orderId}`}{order.items.length > 1 ? ` 외 ${order.items.length - 1}개` : ""}</strong><span>{formatOrderStatus(order.orderStatus)}</span></div><b>{order.totalPrice.toLocaleString()}원</b><ChevronRight /></Link>)}</div>
          )}
        </section>
        <section>
          <header className={styles.sectionHeading}><h2>찜한 상품</h2><Link to="/web/my/wishlist">전체보기 <ChevronRight /></Link></header>
          {loading ? <div className={styles.uploadEmpty}>관심 상품을 불러오는 중이에요.</div> : wishlist.length === 0 ? <div className={styles.uploadEmpty}>관심 상품을 저장하면 여기에 표시됩니다.</div> : (
            <div className={styles.wishlistPreview}>{wishlist.slice(0, 4).map((item) => <Link key={item.wishlistId} to={`/web/products/${item.productId}`}>{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div><Image /></div>}<strong>{item.name}</strong><span>{(item.discountPrice ?? item.price).toLocaleString()}원</span></Link>)}</div>
          )}
        </section>
      </main>
    </div>
  );
}

function SettingsPage({ name: initialName }: { name: string }) {
  const user = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(user?.name || initialName || "");
  const [phone1, setPhone1] = useState("010");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const phone3Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProfile()
      .then((profile) => {
        if (profile.email) setEmail(profile.email);
        if (profile.name) setName(profile.name);
        if (profile.birthDate) setBirthDate(profile.birthDate.substring(0, 10));
        if (profile.phone) {
          const parts = profile.phone.split("-");
          if (parts.length === 3) {
            setPhone1(parts[0]);
            setPhone2(parts[1]);
            setPhone3(parts[2]);
          } else {
            setPhone2(profile.phone);
          }
        }
      })
      .catch((err) => console.error("프로필 정보 로드 실패", err));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneFull = `${phone1}-${phone2}-${phone3}`;
    const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
    if (phone2 || phone3) {
      if (!phoneRegex.test(phoneFull)) {
        window.alert("올바른 휴대폰 번호 형식이 아닙니다 (예: 010-1234-5678)");
        return;
      }
    }

    try {
      setSubmitting(true);
      await updateProfile({
        name,
        phone: phone2 && phone3 ? phoneFull : undefined,
        birthDate: birthDate || undefined,
      });
      window.alert("회원 정보가 성공적으로 수정되었습니다.");
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "회원 정보 수정 중 오류가 발생했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.settings}>
      <div className={styles.avatar}>
        <UserRound size={42} />
      </div>
      <h1>회원정보 수정</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
        <label>
          닉네임(이름)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 입력"
            required
          />
        </label>
        <label>
          이메일 (변경 불가)
          <input
            value={email || "로그인 계정 이메일"}
            disabled
            readOnly
            style={{ backgroundColor: "var(--color-bg-muted, #f5f5f5)", color: "#888", cursor: "not-allowed" }}
          />
        </label>
        <label>
          휴대폰 번호
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" }}>
            <select
              value={phone1}
              onChange={(e) => setPhone1(e.target.value)}
              style={{ flex: 1, height: "44px", padding: "0 8px", borderRadius: "4px", border: "1px solid var(--color-border, #ccc)" }}
            >
              <option value="010">010</option>
              <option value="011">011</option>
              <option value="016">016</option>
              <option value="017">017</option>
              <option value="018">018</option>
              <option value="019">019</option>
            </select>
            <span style={{ color: "#888" }}>-</span>
            <input
              type="text"
              maxLength={4}
              value={phone2}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setPhone2(val);
                if (val.length === 4 && phone3Ref.current) {
                  phone3Ref.current.focus();
                }
              }}
              placeholder="중간 4자리"
              style={{ flex: 1.5, height: "44px", padding: "0 8px", textAlign: "center" }}
            />
            <span style={{ color: "#888" }}>-</span>
            <input
              type="text"
              ref={phone3Ref}
              maxLength={4}
              value={phone3}
              onChange={(e) => setPhone3(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="끝 4자리"
              style={{ flex: 1.5, height: "44px", padding: "0 8px", textAlign: "center" }}
            />
          </div>
        </label>
        <label>
          생년월일
          <input
            type="date"
            value={birthDate}
            max={new Date().toISOString().substring(0, 10)}
            min="1900-01-01"
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting} className={styles.save}>
          {submitting ? "저장 중..." : "저장하기"}
        </button>
      </form>
    </main>
  );
}

function SettingsBody({ kind, name }: { kind: AccountKind; name: string }) {
  if (kind === "notifications") return <NotificationSettings />;
  if (kind === "password") return <PasswordChange />;
  if (kind === "addresses") return <WebAddressBook />;
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
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "비밀번호 변경에 실패했습니다."));
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
    Promise.resolve().then(loadData);
  }, []);

  const handleDownload = async (couponId: number) => {
    try {
      await downloadCoupon(couponId);
      window.alert("쿠폰이 다운로드되어 쿠폰함에 발급되었습니다!");
      loadData();
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "이미 다운로드받았거나 소진된 쿠폰입니다."));
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
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#333", display: "block", marginBottom: "6px" }}>{c.name}</span>
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
