import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronRight, Package, UserRound } from "lucide-react";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebAccountPages.module.css";

type AccountKind = "home" | "profile" | "orders" | "order" | "addresses" | "wishlist" | "points" | "coupons" | "inquiries" | "inquiry";
const NAV = [{ to: "/web/my", label: "마이홈" }, { to: "/web/my/orders", label: "주문 내역" }, { to: "/web/my/addresses", label: "배송지 관리" }, { to: "/web/my/wishlist", label: "찜한 상품" }, { to: "/web/my/points", label: "포인트" }, { to: "/web/my/coupons", label: "쿠폰" }, { to: "/web/my/inquiries", label: "내 문의" }, { to: "/web/my/profile", label: "회원정보 수정" }];
const COPY: Record<AccountKind, { title: string; description: string; cards: string[] }> = {
  home: { title: "마이페이지", description: "주문과 혜택, 내 활동을 한곳에서 관리합니다.", cards: ["진행 중인 주문", "사용 가능한 쿠폰", "보유 포인트", "최근 본 상품"] },
  profile: { title: "회원정보 수정", description: "연락처와 기본 정보를 안전하게 관리합니다.", cards: ["기본 정보", "연락처", "비밀번호 변경", "회원 탈퇴"] },
  orders: { title: "주문 내역", description: "주문 상태와 배송 진행 상황을 확인합니다.", cards: ["주문 상태 필터", "기간 선택", "주문 상품 목록"] },
  order: { title: "주문 상세", description: "주문 상품과 결제·배송 정보를 자세히 확인합니다.", cards: ["주문 상품", "배송 정보", "결제 정보", "취소·반품"] },
  addresses: { title: "배송지 관리", description: "자주 사용하는 배송지를 등록하고 기본 배송지를 지정합니다.", cards: ["기본 배송지", "배송지 목록", "새 배송지 추가"] },
  wishlist: { title: "찜한 상품", description: "관심 상품을 모아보고 장바구니로 옮길 수 있습니다.", cards: ["찜한 상품 목록", "품절·가격 변경 안내"] },
  points: { title: "포인트", description: "사용 가능한 포인트와 적립·사용 내역을 확인합니다.", cards: ["보유 포인트", "적립 예정", "포인트 내역"] },
  coupons: { title: "쿠폰", description: "사용 가능 쿠폰과 만료 예정 혜택을 확인합니다.", cards: ["사용 가능 쿠폰", "쿠폰 등록", "사용·만료 내역"] },
  inquiries: { title: "내 문의", description: "작성한 문의와 답변 상태를 확인합니다.", cards: ["문의 상태 필터", "문의 목록", "새 문의 작성"] },
  inquiry: { title: "문의 상세", description: "문의 내용과 담당자의 답변을 확인합니다.", cards: ["문의 내용", "답변 상태", "답변 내용"] },
};

export function WebAccountPage({ kind }: { kind: AccountKind }) {
  const path = useLocation().pathname;
  const { no, id } = useParams();
  const copy = COPY[kind];
  const suffix = kind === "order" ? ` #${no ?? ""}` : kind === "inquiry" ? ` #${id ?? ""}` : "";
  return <WebLayout><div className={styles.accountLayout}>
    <aside className={styles.sidebar}><div className={styles.profile}><UserRound size={28} /><div><strong>나의 Kopang</strong><span>회원 정보를 확인해 주세요</span></div></div><nav>{NAV.map((item) => <Link key={item.to} to={item.to} className={path === item.to ? styles.active : ""}>{item.label}<ChevronRight size={16} /></Link>)}</nav></aside>
    <main className={styles.content}><header><p>MY KOPANG</p><h1>{copy.title}{suffix}</h1><span>{copy.description}</span></header><div className={styles.cards}>{copy.cards.map((card) => <section key={card}><div><Package size={20} /><h2>{card}</h2></div><p>실제 데이터와 세부 동작이 연결될 콘텐츠 영역입니다.</p><button type="button">관리하기</button></section>)}</div></main>
  </div></WebLayout>;
}
