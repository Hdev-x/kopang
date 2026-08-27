import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { getNotifications, markNotificationClicked, type NotificationItem } from "../../api/notifications";
import s from "./NotificationsPage.module.css";

// 서버 type enum → 화면 표시(라벨·이모지). 모르는 값은 fallback.
const DISPLAY: Record<string, { label: string; emoji: string }> = {
  ABANDON: { label: "장바구니", emoji: "🛒" },
  REBUY: { label: "재구매", emoji: "🔁" },
  WISHLIST: { label: "찜", emoji: "💝" },
  COUPON_EXPIRE: { label: "쿠폰", emoji: "🎟️" },
  WELCOME_BACK: { label: "웰컴백", emoji: "👋" },
  APOLOGY: { label: "사과", emoji: "🙇" },
  COMEBACK: { label: "복귀", emoji: "🎁" },
  RECOMMEND: { label: "추천", emoji: "🎯" },
  NOTICE: { label: "공지", emoji: "📢" },
};
const FALLBACK = { label: "알림", emoji: "🔔" };

// type + refId → 클릭 이동 경로. 대상 없으면 null(이동 안 함).
function linkTo(type: string, refId: number | null): string | null {
  switch (type) {
    case "RECOMMEND":
      return refId ? `/products/${refId}` : null;
    case "ABANDON":
      return "/cart";
    case "COUPON_EXPIRE":
    case "WELCOME_BACK":
    case "APOLOGY":
    case "COMEBACK":
    case "WISHLIST":
    case "REBUY":
      return "/my/coupons";
    case "NOTICE":
      return refId ? `/my/support/notices/${refId}` : "/my/support/notices";
    default:
      return null;
  }
}

// ISO 시각 → "방금 / N분 전 / N시간 전 / N일 전 / 날짜"
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

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getNotifications()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // 알림 클릭 시 읽음/클릭 처리 — UI 먼저 반영(낙관적), API 실패해도 이동은 유지
  const handleRead = (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markNotificationClicked(id).catch(() => { });
  };

  return (
    <Layout>
      <PageHeader title="알림" />
      <div className={s.list}>
        {loading && <p className={s.empty}>불러오는 중...</p>}
        {!loading && error && <p className={s.empty}>알림을 불러오지 못했어요</p>}
        {!loading && !error && items.length === 0 && (
          <p className={s.empty}>받은 알림이 없어요</p>
        )}
        {!loading &&
          !error &&
          items.map((n) => {
            const d = DISPLAY[n.type] ?? FALLBACK;
            const to = linkTo(n.type, n.refId);
            const cls = `${s.item} ${!n.read ? s.unread : ""}`;
            const inner = (
              <>
                <span className={s.emoji}>{d.emoji}</span>
                <div className={s.body}>
                  <p className={s.type}>{d.label} 알림</p>
                  <p className={s.msg}>{n.message}</p>
                  <p className={s.time}>{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className={s.dot} />}
              </>
            );
            return to ? (
              <Link key={n.id} to={to} className={cls} onClick={() => !n.read && handleRead(n.id)}>
                {inner}
              </Link>
            ) : (
              <div key={n.id} className={cls} onClick={() => !n.read && handleRead(n.id)}>
                {inner}
              </div>
            );
          })}
      </div>
    </Layout>
  );
}
