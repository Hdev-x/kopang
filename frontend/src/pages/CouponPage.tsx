import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import s from "./AccountPages.module.css";

const COUPONS = [
  { name: "신규가입 5,000원 할인", cond: "3만원 이상 구매 시", exp: "~2026.07.31" },
  { name: "WOW 멤버십 10% 쿠폰", cond: "최대 1만원 할인", exp: "~2026.07.15" },
  { name: "생일 축하 3,000원", cond: "제한 없음", exp: "~2026.07.10" },
];

export function CouponPage() {
  return (
    <Layout>
      <PageHeader title="쿠폰함" />
      <div className={s.list}>
        {COUPONS.map((c, i) => (
          <Card key={i}>
            <div className={s.coupon}>
              <div className={s.col}>
                <span className={s.couponName}>{c.name}</span>
                <span className={s.muted}>{c.cond}</span>
              </div>
              <span className={s.muted}>{c.exp}</span>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
