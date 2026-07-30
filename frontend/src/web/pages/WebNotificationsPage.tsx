import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNotifications, markNotificationClicked, type NotificationItem } from "../../api/notifications";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebNotificationsPage.module.css";

const DISPLAY: Record<string, { label: string; emoji: string }> = {
  ABANDON: { label: "장바구니", emoji: "🛒" },
  REBUY: { label: "재구매", emoji: "🔁" },
  WISHLIST: { label: "찜", emoji: "💝" },
  COUPON_EXPIRE: { label: "쿠폰", emoji: "🎟️" },
  WELCOME_BACK: { label: "웰컴백", emoji: "🎁" },
  APOLOGY: { label: "사과", emoji: "🙇" },
  COMEBACK: { label: "복귀", emoji: "🎁" },
  RECOMMEND: { label: "추천", emoji: "🎯" },
  NOTICE: { label: "공지", emoji: "📢" },
};
const FALLBACK = { label: "알림", emoji: "🔔" };

function linkTo(type: string, refId: number | null): string | null {
  switch (type) {
    case "RECOMMEND":
      return refId ? `/web/products/${refId}` : "/web/products";
    case "ABANDON":
      return "/web/cart";
    case "COUPON_EXPIRE":
    case "WELCOME_BACK":
    case "APOLOGY":
    case "COMEBACK":
    case "WISHLIST":
    case "REBUY":
      return "/web/my/coupons";
    case "NOTICE":
      return refId ? `/web/support/notices/${refId}` : "/web/support/notices";
    default:
      return null;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export function WebNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getNotifications()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) {
      setItems((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
      // click 처리가 clicked·is_read를 함께 갱신한다(NotificationMapper.markAsClicked).
      // read를 따로 부르면 같은 일을 하는 요청이 하나 더 나간다.
      markNotificationClicked(n.id).catch(() => {});
    }
  };

  return (
    <WebLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>알림 센터</h1>
          <p>주문·배송, 쿠폰 및 혜택 소식을 실시간으로 확인해 보세요.</p>
        </div>

        {loading && <div className={styles.empty}>알림을 불러오는 중입니다...</div>}
        {!loading && error && <div className={styles.empty}>알림을 불러오지 못했습니다.</div>}
        {!loading && !error && items.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🔔</p>
            <p>받은 알림이 없습니다.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className={styles.list}>
            {items.map((n) => {
              const d = DISPLAY[n.type] ?? FALLBACK;
              const to = linkTo(n.type, n.refId);
              const cardClass = `${styles.card} ${!n.read ? styles.unread : ""}`;

              const innerContent = (
                <>
                  <div className={styles.emojiWrapper}>{d.emoji}</div>
                  <div className={styles.body}>
                    <div className={styles.cardHeader}>
                      <span className={styles.tag}>{d.label} 알림</span>
                      <span className={styles.time}>{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className={styles.message}>{n.message}</p>
                  </div>
                  {!n.read && <span className={styles.unreadBadge} />}
                </>
              );

              return to ? (
                <Link key={n.id} to={to} className={cardClass} onClick={() => handleItemClick(n)}>
                  {innerContent}
                </Link>
              ) : (
                <button type="button" key={n.id} className={cardClass} onClick={() => handleItemClick(n)}>
                  {innerContent}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </WebLayout>
  );
}
