import { useEffect, useState, useRef } from "react";
import { ChevronRight, Download, Heart, Image as ImageIcon, Package, Search, Star, Ticket, UserRound, Eye, EyeOff } from "lucide-react";
import { getProfile, updateProfile } from "../../api/auth";
import { getAvailableCoupons, getMyCoupons, downloadCoupon, type CouponResponse, type UserCouponResponse } from "../../api/coupon";
import { getPointBalance } from "../../api/point";
import { cancelOrder, confirmPurchase, formatOrderStatus, getOrderDetails, getOrders, type Order } from "../../api/order";
import { deleteWishlist, getWishlist, type Wishlist } from "../../api/wishlist";
import { createProductReview, deleteReview, getMyReviews, type Review } from "../../api/review";
import { addToCart } from "../../api/cart";
import { getQnaList } from "../../api/qna";
import type { QnaSummary } from "../../types/qna";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { updateAuthUser } from "../../lib/auth";
import { WebLayout } from "../components/WebLayout";
import { WebAddressBook } from "./WebAddressBook";
import styles from "./WebAccountPages.module.css";

type AccountKind = "home" | "profile" | "notifications" | "password" | "orders" | "order" | "addresses" | "wishlist" | "points" | "coupons" | "inquiries" | "inquiry" | "reviews" | "review-write";
const SHOPPING_NAV = [{ to: "/web/my/orders", label: "주문배송목록" }, { to: "/web/my/wishlist", label: "찜한 상품" }, { to: "/web/my/inquiries", label: "나의문의내역" }, { to: "/web/my/points", label: "포인트" }, { to: "/web/my/coupons", label: "쿠폰" }];
const REVIEW_NAV = [{ to: "/web/my/reviews/write", label: "리뷰 남기기" }, { to: "/web/my/reviews", label: "내가 남긴 리뷰" }];
const SETTING_NAV = [{ to: "/web/my/profile", label: "회원정보 수정" }, { to: "/web/my/notifications", label: "알림 설정" }, { to: "/web/my/addresses", label: "배송지 설정" }, { to: "/web/my/password", label: "비밀번호 변경" }];
const SETTING_KINDS: AccountKind[] = ["profile", "notifications", "password", "addresses"];

export function WebAccountPage({ kind }: { kind: AccountKind }) {
  const user = useAuth();
  const navigate = useNavigate();
  const { no, id } = useParams();

  useEffect(() => {
    if (!user) {
      navigate("/web/login", { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const setting = SETTING_KINDS.includes(kind);
  const review = kind === "reviews" || kind === "review-write";
  const shopping = ["orders", "order", "wishlist", "points", "coupons", "inquiries", "inquiry"].includes(kind);
  const tabs = review ? REVIEW_NAV : setting ? SETTING_NAV : [];

  return <WebLayout>
    {shopping ? <WebShoppingNav activeKind={kind} /> : tabs.length > 0 && <nav className={styles.localNav}>{tabs.map((item) => <Link key={item.to} to={item.to} className={isActive(kind, item.to) ? styles.active : ""}>{item.label}</Link>)}</nav>}
    {kind === "home" ? <ProfileHome name={user.name} /> : review ? <ReviewPage write={kind === "review-write"} /> : setting ? <SettingsBody kind={kind} name={user.name} /> : kind === "coupons" ? <WebCouponsTab /> : <ShoppingPage kind={kind} suffix={kind === "order" ? no : kind === "inquiry" ? id : undefined} />}
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
            <div className={styles.wishlistPreview}>
              {wishlist.slice(0, 4).map((item) => {
                const rate = item.discountRate || (item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : 0);
                const hasDiscount = Boolean(rate && rate > 0);
                const finalPrice = hasDiscount ? Math.round((item.price * (100 - rate)) / 100) : item.price;

                return (
                  <Link key={item.wishlistId} to={`/web/products/${item.productId}`}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div><ImageIcon /></div>}
                    <strong>{item.name}</strong>
                    {hasDiscount ? (
                      <span style={{ display: "flex", flexDirection: "column", gap: "1px", marginTop: "2px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ color: "#ff4d4f", fontWeight: 700, fontSize: "11px" }}>{rate}%</span>
                          <del style={{ fontSize: "11px", color: "#888", textDecoration: "line-through", fontWeight: 400 }}>{item.price.toLocaleString()}원</del>
                        </span>
                        <b style={{ fontSize: "13px", fontWeight: 700, color: "#222" }}>{finalPrice.toLocaleString()}원</b>
                      </span>
                    ) : (
                      <span>{item.price.toLocaleString()}원</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ReviewPage({ write }: { write: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<{ productId: number; name: string; imageUrl?: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 조회와 "로딩 표시 켜기"를 나눈다. effect에서 동기 setState를 부르면 렌더가 한 번 더 돈다.
  // 첫 진입은 loading 초기값(true)이 이미 담당하므로 fetch만 부르면 된다.
  const fetchData = () =>
    Promise.all([
      getMyReviews().catch(() => []),
      getOrders().catch(() => []),
    ])
      .then(([reviewData, orderData]) => {
        setReviews(Array.isArray(reviewData) ? reviewData : []);
        setOrders(Array.isArray(orderData) ? orderData : []);
      })
      .catch((err) => {
        console.error("리뷰 및 주문 데이터 로드 실패", err);
        setError(true);
      })
      .finally(() => setLoading(false));

  const loadData = () => {
    setLoading(true);
    void fetchData();
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleDelete = async (reviewId: number) => {
    if (!window.confirm("리뷰를 삭제하시겠습니까?")) return;
    try {
      await deleteReview(reviewId);
      window.alert("리뷰가 삭제되었습니다.");
      loadData();
    } catch {
      window.alert("리뷰 삭제에 실패했습니다.");
    }
  };

  const handleOpenWriteModal = (prod: { productId: number; name: string; imageUrl?: string }) => {
    setSelectedProduct(prod);
    setRating(5);
    setContent("");
    setImageUrl("");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!content.trim()) {
      window.alert("리뷰 내용을 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await createProductReview(selectedProduct.productId, {
        rating,
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });
      window.alert("리뷰가 성공적으로 등록되었습니다!");
      setSelectedProduct(null);
      loadData();
    } catch (err: unknown) {
      console.error("리뷰 등록 실패", err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "리뷰 등록에 실패했습니다.";
      window.alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const reviewedProductIds = new Set(reviews.map((r) => r.productId));
  const reviewableProducts: Array<{
    productId: number;
    name: string;
    price: number;
    imageUrl: string;
    orderId: number;
    createdAt?: string;
  }> = [];

  const addedIds = new Set<number>();
  orders.forEach((o) => {
    o.items?.forEach((item) => {
      if (!reviewedProductIds.has(item.productId) && !addedIds.has(item.productId)) {
        addedIds.add(item.productId);
        reviewableProducts.push({
          productId: item.productId,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          orderId: o.orderId,
          createdAt: o.createdAt,
        });
      }
    });
  });

  const filteredReviewable = reviewableProducts.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <main className={styles.reviewPage}>
        <div style={{ textAlign: "center", padding: "80px 0", color: "#888" }}>
          리뷰 정보 로딩 중...
        </div>
      </main>
    );
  }

  if (write) {
    return (
      <main className={styles.reviewPage}>
        <h1>내가 사용한 상품 리뷰쓰기</h1>
        <div className={styles.reviewSearch}>
          <input
            placeholder="브랜드명 혹은 상품명 입력"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button">
            <Search size={18} />검색
          </button>
        </div>

        {filteredReviewable.length === 0 ? (
          <div className={styles.empty}>
            <Star size={36} />
            <strong>작성 가능한 리뷰가 없어요.</strong>
            <p>구매하신 상품이 없거나 모든 구매 상품의 리뷰 작성을 완료하셨습니다.</p>
          </div>
        ) : (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredReviewable.map((p) => (
              <div
                key={p.productId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  border: "1px solid var(--color-border, #eee)",
                  borderRadius: "12px",
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px", border: "1px solid #eee" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{p.name}</div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      {p.price.toLocaleString()}원 · 주문번호 #{p.orderId}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenWriteModal(p)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "var(--color-primary, #007bff)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  리뷰 작성하기
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedProduct && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: "480px",
                backgroundColor: "#fff",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>리뷰 작성</h2>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
                {selectedProduct.name}
              </div>

              <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#888", marginBottom: "8px" }}>
                    평점 선택
                  </label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={28}
                        style={{ cursor: "pointer" }}
                        fill={star <= rating ? "#ffc107" : "none"}
                        color={star <= rating ? "#ffc107" : "#ccc"}
                        onClick={() => setRating(star)}
                      />
                    ))}
                    <span style={{ fontWeight: 700, fontSize: "16px", marginLeft: "8px" }}>{rating}점</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#888", marginBottom: "8px" }}>
                    리뷰 내용
                  </label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="상품에 대한 후기를 자유롭게 남겨주세요."
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                      resize: "none",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid #ccc",
                      background: "#fff",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: "var(--color-primary, #007bff)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    {submitting ? "등록 중..." : "등록하기"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.reviewPage}>
        <div style={{ textAlign: "center", padding: "80px 0", color: "#888" }}>
          리뷰 목록을 불러오는 중...
        </div>
      </main>
    );
  }

  if (error || reviews.length === 0) {
    return (
      <main className={styles.reviewPage}>
        <div className={styles.empty}>
          <Star size={36} />
          <strong>내가 남긴 리뷰가 없어요.</strong>
          <p>상품을 사용한 경험을 다른 사용자와 공유해 보세요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.reviewPage}>
      <h1 style={{ marginBottom: "20px" }}>내가 남긴 리뷰 ({reviews.length})</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {reviews.map((r) => (
          <div
            key={r.reviewId}
            style={{
              border: "1px solid var(--color-border, #eee)",
              borderRadius: "12px",
              padding: "20px",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <Link
                to={`/web/products/${r.productId}`}
                style={{
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "var(--color-primary, #007bff)",
                  textDecoration: "none",
                }}
              >
                {r.productName || `상품 #${r.productId}`}
              </Link>
              <span style={{ fontSize: "13px", color: "#888" }}>
                {r.createdAt ? r.createdAt.substring(0, 10) : ""}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={star <= Math.round(r.rating) ? "#ffc107" : "none"}
                  color={star <= Math.round(r.rating) ? "#ffc107" : "#ccc"}
                />
              ))}
              <span style={{ fontWeight: 600, fontSize: "14px", marginLeft: "4px" }}>
                {r.rating.toFixed(1)}점
              </span>
            </div>

            <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.6, margin: "12px 0" }}>
              {r.content}
            </p>

            {r.image && (
              <img
                src={r.image}
                alt="리뷰 이미지"
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginTop: "8px",
                }}
              />
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => handleDelete(r.reviewId)}
                style={{
                  padding: "4px 10px",
                  border: "1px solid #ff4d4f",
                  color: "#ff4d4f",
                  borderRadius: "6px",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                삭제하기
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
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
  }, []);

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
      updateAuthUser({ name, email });
      window.alert("회원 정보가 성공적으로 수정되었습니다.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "회원 정보 수정 중 오류가 발생했습니다.";
      window.alert(msg);
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

function ShoppingPage({ kind, suffix }: { kind: AccountKind; suffix?: string }) {
  const [points, setPoints] = useState(0);
  const [couponsCount, setCouponsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    Promise.all([
      getPointBalance().catch(() => ({ balance: 0 })),
      getMyCoupons().catch(() => []),
      getOrders().catch(() => []),
    ]).then(([pointData, couponData, orderData]) => {
      setPoints(pointData.balance);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const validCoupons = couponData.filter((c) => {
        if (c.used) return false;
        if (!c.expiresAt) return true;
        return new Date(c.expiresAt) >= today;
      });
      setCouponsCount(validCoupons.length);
      setOrders(orderData);
      const activeOrders = orderData.filter((o) => o.orderStatus !== "CANCELLED" && o.orderStatus !== "CONFIRMED" && o.orderStatus !== "RETURNED");
      setOrdersCount(activeOrders.length);
    }).catch(console.error);
  }, []);

  const getStepCount = (step: string) => {
    return orders.filter((o) => {
      const st = (o.orderStatus || o.paymentStatus || "").toUpperCase();
      if (step === "입금대기") return st === "PENDING";
      if (step === "결제완료") return st === "PAID" || st === "ORDERED";
      if (step === "배송준비") return st === "PREPARING" || st === "READY";
      if (step === "배송중") return st === "SHIPPING" || st === "IN_DELIVERY";
      if (step === "배송완료") return st === "DELIVERED";
      if (step === "구매확정") return st === "CONFIRMED";
      return false;
    }).length;
  };

  const titleMap: Partial<Record<AccountKind, string>> = {
    orders: "주문배송목록",
    order: `주문 상세 #${suffix ?? ""}`,
    addresses: "배송지 관리",
    wishlist: "상품 스크랩북",
    points: "포인트",
    coupons: "쿠폰",
    inquiries: "나의 문의내역",
    inquiry: `문의 상세 #${suffix ?? ""}`
  };

  return (
    <main className={styles.shopping}>
      <section className={styles.summary}>
        <Link to="/web/my/coupons" style={{ display: "contents", textDecoration: "none", color: "inherit" }}>
          <span><Ticket />쿠폰 <b>{couponsCount}</b></span>
        </Link>
        <Link to="/web/my/points" style={{ display: "contents", textDecoration: "none", color: "inherit" }}>
          <span><Star />포인트 <b>{points.toLocaleString()}P</b></span>
        </Link>
        <Link to="/web/my/orders" style={{ display: "contents", textDecoration: "none", color: "inherit" }}>
          <span><Package />진행 중인 주문 <b>{ordersCount}</b></span>
        </Link>
      </section>
      <h1>{titleMap[kind] ?? "나의 쇼핑"}</h1>
      <div className={styles.orderSteps}>
        {["입금대기", "결제완료", "배송준비", "배송중", "배송완료", "구매확정"].map((step, index) => (
          <span key={step}>
            {step}<b>{getStepCount(step)}</b>{index < 5 && <ChevronRight />}
          </span>
        ))}
      </div>

      {kind === "orders" ? (
        <WebOrdersBody />
      ) : kind === "order" && suffix ? (
        <WebOrderDetailBody orderId={Number(suffix)} />
      ) : kind === "wishlist" ? (
        <WebWishlistBody />
      ) : kind === "inquiries" ? (
        <WebInquiriesBody />
      ) : (
        <div className={styles.empty}>
          <Package size={36} />
          <strong>표시할 내역이 없어요.</strong>
        </div>
      )}
    </main>
  );
}

function WebOrdersBody() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchOrders = () =>
    getOrders()
      .then(setOrders)
      .catch(() => setError(true))
      .finally(() => setLoading(false));

  const loadOrders = () => {
    setLoading(true);
    void fetchOrders();
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("주문을 취소하시겠습니까?")) return;
    try {
      await cancelOrder(orderId);
      window.alert("주문이 취소되었습니다.");
      loadOrders();
    } catch {
      window.alert("주문 취소 처리에 실패했습니다.");
    }
  };

  const handleConfirmPurchase = async (orderId: number) => {
    if (!window.confirm("구매를 확정하시겠습니까?")) return;
    try {
      await confirmPurchase(orderId);
      window.alert("구매가 확정되었습니다.");
      loadOrders();
    } catch {
      window.alert("구매 확정 처리에 실패했습니다.");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>주문 내역을 불러오는 중...</div>;
  if (error) return <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>주문 내역을 불러오지 못했습니다.</div>;
  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <Package size={36} />
        <strong>주문 내역이 없어요.</strong>
        <p>원하는 상품을 주문해 보세요!</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {orders.map((o) => (
        <div key={o.orderId} style={{ border: "1px solid var(--color-border, #eee)", borderRadius: "12px", padding: "20px", background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "16px" }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: "16px", marginRight: "8px" }}>주문번호 #{o.orderId}</span>
              <span style={{ fontSize: "13px", color: "#888" }}>({o.createdAt ? o.createdAt.slice(0, 10) : ""})</span>
            </div>
            <span style={{ padding: "4px 10px", borderRadius: "16px", backgroundColor: "#e6f7ff", color: "#007bff", fontWeight: 600, fontSize: "13px" }}>
              {formatOrderStatus(o.orderStatus)}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {o.items?.map((item) => (
              <div key={item.orderItemId || item.productId} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <img src={item.imageUrl} alt={item.name} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px", border: "1px solid #eee" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{item.name}</div>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    {item.quantity}개 · {(item.price * item.quantity).toLocaleString()}원
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed #eee" }}>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>
              총 결제 금액: <span style={{ color: "var(--color-primary, #007bff)" }}>{o.totalPrice?.toLocaleString()}원</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {(o.orderStatus === "PAID" || o.orderStatus === "PENDING") && (
                <button type="button" onClick={() => handleCancelOrder(o.orderId)} style={{ padding: "6px 12px", border: "1px solid #ff4d4f", color: "#ff4d4f", borderRadius: "6px", background: "none", cursor: "pointer", fontSize: "13px" }}>
                  주문 취소
                </button>
              )}
              {o.orderStatus === "DELIVERED" && (
                <button type="button" onClick={() => handleConfirmPurchase(o.orderId)} style={{ padding: "6px 12px", border: "1px solid #007bff", color: "#007bff", borderRadius: "6px", background: "none", cursor: "pointer", fontSize: "13px" }}>
                  구매 확정
                </button>
              )}
              <Link to={`/web/my/orders/${o.orderId}`} style={{ padding: "6px 12px", border: "1px solid #ddd", color: "#333", borderRadius: "6px", textDecoration: "none", fontSize: "13px" }}>
                상세보기
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WebOrderDetailBody({ orderId }: { orderId: number }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    getOrderDetails(orderId)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>주문 정보를 불러오는 중...</div>;
  if (error || !order) return <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>주문 정보를 찾을 수 없습니다.</div>;

  return (
    <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ border: "1px solid #eee", borderRadius: "12px", padding: "20px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>주문번호 #{order.orderId}</h2>
            <span style={{ fontSize: "13px", color: "#888" }}>주문일시: {order.createdAt}</span>
          </div>
          <span style={{ padding: "6px 14px", borderRadius: "20px", backgroundColor: "#e6f7ff", color: "#007bff", fontWeight: 700, fontSize: "14px" }}>
            {formatOrderStatus(order.orderStatus)}
          </span>
        </div>

        <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "16px 0 12px" }}>주문 상품</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {order.items?.map((item) => (
            <div key={item.orderItemId || item.productId} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "12px", border: "1px solid #f0f0f0", borderRadius: "8px" }}>
              <img src={item.imageUrl} alt={item.name} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px" }} />
              <div style={{ flex: 1 }}>
                <Link to={`/web/products/${item.productId}`} style={{ fontWeight: 600, fontSize: "14px", color: "#333", textDecoration: "none" }}>
                  {item.name}
                </Link>
                <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                  {item.quantity}개 · {(item.price * item.quantity).toLocaleString()}원
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700 }}>
          <span>총 결제금액</span>
          <span style={{ color: "#007bff" }}>{order.totalPrice?.toLocaleString()}원</span>
        </div>
      </div>

      <Link to="/web/my/orders" style={{ display: "inline-block", textAlign: "center", padding: "12px 24px", backgroundColor: "#f5f5f5", color: "#333", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}>
        주문 목록으로 돌아가기
      </Link>
    </div>
  );
}

function WebWishlistBody() {
  const [items, setItems] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () =>
    getWishlist()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    void fetchData();
  }, []);

  const handleDelete = async (productId: number) => {
    try {
      await deleteWishlist(productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      window.alert("찜 목록에서 삭제되었습니다.");
    } catch {
      window.alert("삭제 실패했습니다.");
    }
  };

  const handleCart = async (productId: number) => {
    try {
      await addToCart(productId, 1);
      window.alert("장바구니에 담았습니다.");
    } catch {
      window.alert("장바구니 담기에 실패했습니다.");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>찜한 상품을 불러오는 중...</div>;
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <Heart size={36} />
        <strong>찜한 상품이 없어요.</strong>
        <p>마음에 드는 상품의 하트를 눌러 찜해 보세요!</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
      {items.map((w) => {
        const finalPrice = (w.discountPrice && w.discountPrice > 0 && w.discountPrice < w.price)
          ? w.discountPrice
          : w.price;
        const hasDiscount = Boolean(w.discountPrice && w.discountPrice > 0 && w.discountPrice < w.price);
        const discountRate = hasDiscount
          ? Math.round(((w.price - w.discountPrice!) / w.price) * 100)
          : 0;

        return (
          <div key={w.wishlistId || w.productId} style={{ border: "1px solid #eee", borderRadius: "12px", padding: "16px", background: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <Link to={`/web/products/${w.productId}`} style={{ textDecoration: "none", color: "inherit" }}>
                <img src={w.imageUrl} alt={w.name} style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "8px", marginBottom: "12px" }} />
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "6px", lineHeight: "1.4" }}>{w.name}</div>
              </Link>
              <div style={{ marginTop: "8px", marginBottom: "12px" }}>
                {hasDiscount ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#ff4d4f", fontWeight: 700, fontSize: "14px" }}>
                        {discountRate}%
                      </span>
                      <del style={{ fontSize: "12px", color: "#888", textDecoration: "line-through", fontWeight: 400 }}>
                        {w.price.toLocaleString()}원
                      </del>
                    </div>
                    <strong style={{ fontWeight: 700, fontSize: "16px", color: "#222" }}>
                      {finalPrice.toLocaleString()}원
                    </strong>
                  </div>
                ) : (
                  <strong style={{ fontWeight: 700, fontSize: "16px", color: "#222" }}>
                    {w.price.toLocaleString()}원
                  </strong>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={() => handleCart(w.productId)} style={{ flex: 1, padding: "8px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>
                장바구니
              </button>
              <button type="button" onClick={() => handleDelete(w.productId)} style={{ padding: "8px 12px", border: "1px solid #ddd", color: "#666", borderRadius: "6px", background: "#fff", cursor: "pointer", fontSize: "13px" }}>
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WebInquiriesBody() {
  const [list, setList] = useState<QnaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQnaList()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>문의 내역을 불러오는 중...</div>;
  if (list.length === 0) {
    return (
      <div className={styles.empty}>
        <Package size={36} />
        <strong>등록된 문의 내역이 없어요.</strong>
        <p>궁금한 점이 있다면 고객센터로 문의해 보세요.</p>
        <Link to="/web/support/inquiry" style={{ marginTop: "12px", padding: "8px 16px", backgroundColor: "#007bff", color: "#fff", borderRadius: "6px", textDecoration: "none", fontWeight: 600 }}>
          1:1 문의하기
        </Link>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "12px" }}>
        <span style={{ fontSize: "14px", color: "#666" }}>총 <strong>{list.length}</strong>건의 문의 내역이 있습니다.</span>
        <Link
          to="/web/support/inquiry"
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--color-primary, #007bff)",
            color: "#ffffff",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          + 1:1 문의하기
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {list.map((q) => (
          <div key={q.id} style={{ border: "1px solid #eee", borderRadius: "10px", padding: "16px", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, backgroundColor: q.status === "답변완료" ? "#e6f7ff" : "#fff7e6", color: q.status === "답변완료" ? "#007bff" : "#fa8c16" }}>
                {q.status}
              </span>
              <span style={{ fontSize: "12px", color: "#999" }}>{q.createdAt?.slice(0, 10)}</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: "15px", color: "#222" }}>Q. {q.title}</div>
            {q.answerContent && (
              <div style={{ marginTop: "10px", padding: "12px", backgroundColor: "#f9f9f9", borderRadius: "8px", fontSize: "14px", color: "#444" }}>
                A. {q.answerContent}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
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
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "비밀번호 변경에 실패했습니다.";
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
    let isMounted = true;
    const fetchData = async () => {
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
        if (isMounted) {
          setMyCoupons(validMy);
          setAvailableCoupons(availableData);
        }
      } catch (err) {
        console.error("웹 쿠폰 데이터 로드 실패", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownload = async (couponId: number) => {
    try {
      await downloadCoupon(couponId);
      window.alert("쿠폰이 다운로드되어 쿠폰함에 발급되었습니다!");
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "이미 다운로드받았거나 소진된 쿠폰입니다.";
      window.alert(msg);
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
