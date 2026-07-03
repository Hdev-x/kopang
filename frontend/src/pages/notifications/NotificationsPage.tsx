import { Link } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { NOTIFICATIONS, type NotiType } from "../../mocks/notificationData";
import s from "./NotificationsPage.module.css";

const EMOJI: Record<NotiType, string> = {
  방치: "🛒",
  재구매: "🔁",
  쿠폰: "🎟️",
  추천: "🎯",
  공지: "📢",
};

export function NotificationsPage() {
  return (
    <Layout>
      <PageHeader title="알림" />
      <div className={s.list}>
        {NOTIFICATIONS.map((n) => (
          <Link key={n.id} to={n.to ?? "#"} className={`${s.item} ${!n.read ? s.unread : ""}`}>
            <span className={s.emoji}>{EMOJI[n.type]}</span>
            <div className={s.body}>
              <p className={s.type}>{n.type} 알림</p>
              <p className={s.msg}>{n.message}</p>
              <p className={s.time}>{n.time}</p>
            </div>
            {!n.read && <span className={s.dot} />}
          </Link>
        ))}
      </div>
    </Layout>
  );
}
