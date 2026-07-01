// 알림 목업 — 이탈 대응 채널이 사용자에게 도착하는 자리(②대응 반응 추적의 화면측)
export type NotiType = "방치" | "재구매" | "쿠폰" | "추천" | "공지";

export type Notification = {
  id: string;
  type: NotiType;
  message: string;
  time: string;
  read: boolean;
  to?: string;
};

export const NOTIFICATIONS: Notification[] = [
  { id: "1", type: "방치", message: "장바구니에 담아둔 '유기농 오이'가 기다려요. 지금 구매 시 5% 추가할인", time: "10분 전", read: false, to: "/cart" },
  { id: "2", type: "재구매", message: "자주 사시던 '제주 삼다수' 다시 살 때가 됐어요", time: "2시간 전", read: false, to: "/products/2" },
  { id: "3", type: "쿠폰", message: "이탈방지 5,000원 쿠폰이 도착했어요", time: "어제", read: true, to: "/my/coupons" },
  { id: "4", type: "추천", message: "회원님 취향 저격! 맞춤 추천 상품을 확인해보세요", time: "어제", read: true, to: "/" },
  { id: "5", type: "공지", message: "7월 배송 일정 안내", time: "3일 전", read: true, to: "/my/support/notices/n1" },
];
