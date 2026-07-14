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

const MENU = [
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

  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [couponsCount, setCouponsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  // 실시간 마이페이지 요약 데이터 로드
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    Promise.all([
      getPointBalance().catch(() => ({ balance: 0 })),
      getMyCoupons().catch(() => []),
      getOrders().catch(() => []),
    ])
      .then(([pointData, couponData, orderData]) => {
        setPoints(pointData.balance);
        setCouponsCount(couponData.filter((c) => !c.used).length);
        setOrdersCount(orderData.length);
      })
      .catch((err) => {
        console.error("마이페이지 정보 획득 실패", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  // 로그인 게이트
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

  // 관리자 권한이 있는 경우 메뉴에 관리자 콘솔 바로가기 동적 추가
  const menuList = [...MENU];
  if (user.role === "ADMIN") {
    menuList.unshift({ label: "🛠️ 관리자 콘솔 바로가기", to: "/admin" });
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "80px", color: "var(--color-text-muted)" }}>로딩 중...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <p className={styles.hello}>
        <strong>{user.name}</strong>님 환영해요 👋
        {user.role === "ADMIN" && <span style={{ fontSize: "12px", color: "var(--color-primary)", marginLeft: "8px", fontWeight: "bold" }}>(관리자 계정)</span>}
      </p>

      <div className={styles.summary}>
        <div className={styles.summaryItem} style={{ cursor: "pointer" }} onClick={() => navigate("/my/points")}>
          <div className={styles.summaryNum}>{points.toLocaleString()}P</div>
          <div className={styles.summaryLabel}>포인트</div>
        </div>
        <div className={styles.summaryItem} style={{ cursor: "pointer" }} onClick={() => navigate("/my/coupons")}>
          <div className={styles.summaryNum}>{couponsCount}장</div>
          <div className={styles.summaryLabel}>쿠폰</div>
        </div>
        <div className={styles.summaryItem} style={{ cursor: "pointer" }} onClick={() => navigate("/my/orders")}>
          <div className={styles.summaryNum}>{ordersCount}건</div>
          <div className={styles.summaryLabel}>주문</div>
        </div>
      </div>

      <div className={styles.menu}>
        {menuList.map((m) =>
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
          )
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
