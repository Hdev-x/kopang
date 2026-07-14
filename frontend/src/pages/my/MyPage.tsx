import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Layout } from "../../components/Layout";
import { Button } from "../../components/Button";
import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../lib/auth";
import { getPointBalance } from "../../api/point";
import { getMyCoupons } from "../../api/coupon";
import { getOrders } from "../../api/order";
import styles from "./MyPage.module.css";

// 목업 메뉴 — to가 있으면 이동, 없으면 항목만 노출
const MENU: { label: string; to?: string }[] = [
  { label: "주문내역", to: "/my/orders" },
  { label: "찜한 상품", to: "/my/wishlist" },
  { label: "포인트 내역", to: "/my/points" },
  { label: "쿠폰함", to: "/my/coupons" },
  { label: "WOW 멤버십", to: "/membership" },
  { label: "회원정보 수정", to: "/my/profile" },
  { label: "배송지 관리", to: "/my/addresses" },
  { label: "문의내역", to: "/my/inquiries" },
  { label: "고객센터", to: "/my/support" },
];

export function MyPage() {
  const user = useAuth();
  const navigate = useNavigate();

  const [points, setPoints] = useState<number | null>(null);
  const [coupons, setCoupons] = useState<number | null>(null);
  const [orders, setOrders] = useState<number | null>(null);

  // 실시간 계정 요약 데이터 로드
  useEffect(() => {
    if (!user) return;

    Promise.all([
      getPointBalance().then(d => d.balance).catch(() => 0),
      getMyCoupons().then(list => list.filter(c => !c.used).length).catch(() => 0),
      getOrders().then(list => list.length).catch(() => 0)
    ]).then(([p, c, o]) => {
      setPoints(p);
      setCoupons(c);
      setOrders(o);
    });
  }, [user]);

  // 로그인 안 했으면 게이트 화면
  if (!user) {
    return (
      <Layout>
        <div className={styles.gate}>
          <p className={styles.gateText}>로그인이 필요한 페이지예요.</p>
          <Button onClick={() => navigate("/login")}>로그인하러 가기</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <p className={styles.hello}>
        <strong>{user.name}</strong>님 환영해요 👋
      </p>

      <div className={styles.summary}>
        <div className={styles.summaryItem} style={{ cursor: "pointer" }} onClick={() => navigate("/my/points")}>
          <div className={styles.summaryNum}>
            {points !== null ? `${points.toLocaleString()}P` : "-"}
          </div>
          <div className={styles.summaryLabel}>포인트</div>
        </div>
        <div className={styles.summaryItem} style={{ cursor: "pointer" }} onClick={() => navigate("/my/coupons")}>
          <div className={styles.summaryNum}>
            {coupons !== null ? `${coupons}장` : "-"}
          </div>
          <div className={styles.summaryLabel}>쿠폰</div>
        </div>
        <div className={styles.summaryItem} style={{ cursor: "pointer" }} onClick={() => navigate("/my/orders")}>
          <div className={styles.summaryNum}>
            {orders !== null ? `${orders}건` : "-"}
          </div>
          <div className={styles.summaryLabel}>주문</div>
        </div>
      </div>

      <div className={styles.menu}>
        {MENU.map((m) =>
          m.to ? (
            <Link key={m.label} to={m.to} className={styles.menuItem}>
              {m.label}
              <ChevronRight size={18} className={styles.chevron} />
            </Link>
          ) : (
            <button key={m.label} type="button" className={styles.menuItem}>
              {m.label}
              <ChevronRight size={18} className={styles.chevron} />
            </button>
          ),
        )}
      </div>

      <Button
        variant="ghost"
        className={styles.logout}
        onClick={() => {
          logout();
          navigate("/");
        }}
      >
        로그아웃
      </Button>
    </Layout>
  );
}
