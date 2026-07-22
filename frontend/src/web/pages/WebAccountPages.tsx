import { Bookmark, ChevronRight, Heart, Package, Search, Star, Ticket, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebAccountPages.module.css";

type AccountKind = "home" | "profile" | "orders" | "order" | "addresses" | "wishlist" | "points" | "coupons" | "inquiries" | "inquiry" | "reviews" | "review-write";
const SHOPPING_NAV = [{ to: "/web/my/orders", label: "주문배송목록" }, { to: "/web/my/wishlist", label: "상품 스크랩북" }, { to: "/web/membership", label: "멤버십" }, { to: "/web/my/inquiries", label: "나의문의내역" }, { to: "/web/my/points", label: "포인트" }, { to: "/web/my/coupons", label: "쿠폰" }, { to: "/web/my/addresses", label: "배송지" }, { to: "/web/support", label: "고객센터" }];
const REVIEW_NAV = [{ to: "/web/my/reviews/write", label: "리뷰 남기기" }, { to: "/web/my/reviews", label: "내가 남긴 리뷰" }];
const SETTING_NAV = [{ to: "/web/my/profile", label: "회원정보 수정" }, { to: "/web/notifications", label: "알림 설정" }, { to: "/web/my/addresses", label: "배송지 설정" }, { to: "/web/find-password", label: "비밀번호 변경" }];

export function WebAccountPage({ kind }: { kind: AccountKind }) {
  const user = useAuth();
  const { no, id } = useParams();
  const shopping = ["orders", "order", "addresses", "wishlist", "points", "coupons", "inquiries", "inquiry"].includes(kind);
  const review = kind === "reviews" || kind === "review-write";
  const tabs = review ? REVIEW_NAV : kind === "profile" ? SETTING_NAV : [];

  return <WebLayout>
    {shopping ? <WebShoppingNav activeKind={kind} /> : tabs.length > 0 && <nav className={styles.localNav}>{tabs.map((item) => <Link key={item.to} to={item.to} className={isActive(kind, item.to) ? styles.active : ""}>{item.label}</Link>)}</nav>}
    {kind === "home" ? <ProfileHome name={user?.name ?? "Kopang 사용자"} /> : review ? <ReviewPage write={kind === "review-write"} /> : kind === "profile" ? <SettingsPage name={user?.name ?? ""} /> : <ShoppingPage kind={kind} suffix={kind === "order" ? no : kind === "inquiry" ? id : undefined} />}
  </WebLayout>;
}

export function WebShoppingNav({ activeKind }: { activeKind: string }) {
  return <nav className={styles.localNav}>{SHOPPING_NAV.map((item) => <Link key={item.to} to={item.to} className={isActive(activeKind as AccountKind, item.to) ? styles.active : ""}>{item.label}</Link>)}</nav>;
}

function ProfileHome({ name }: { name: string }) {
  return <div className={styles.profileLayout}><aside className={styles.profileCard}><div className={styles.avatar}><UserRound size={42} /></div><h1>{name}</h1><p>팔로워 0 · 활동지수 0</p><Link to="/web/my/profile">설정</Link><div className={styles.profileStats}><span><Bookmark />스크랩북<b>0</b></span><span><Heart />좋아요<b>0</b></span><span><Ticket />내 쿠폰<b>0</b></span></div></aside><main className={styles.profileContent}><section><h2>최근 활동</h2><div className={styles.uploadEmpty}>첫 번째 활동을 시작해 보세요.</div></section><section><h2>찜한 상품</h2><div className={styles.uploadEmpty}>관심 상품을 저장하면 여기에 표시됩니다.</div></section></main></div>;
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

function isActive(kind: AccountKind, to: string) {
  if (kind === "reviews") return to.endsWith("/reviews");
  if (kind === "review-write") return to.endsWith("/write");
  const value = to.split("/").pop();
  return kind === value || (kind === "order" && value === "orders") || (kind === "inquiry" && value === "inquiries");
}
