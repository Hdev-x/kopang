import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { ORDERS, orderTotal, productOf } from "../mocks/orderData";
import s from "./AccountPages.module.css";

export function OrderHistoryPage() {
  return (
    <Layout>
      <PageHeader title="주문내역" />
      <div className={s.list}>
        {ORDERS.map((o) => {
          const first = productOf(o.items[0].productId);
          const label =
            (first?.name ?? "상품") +
            (o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : "");
          return (
            <Link key={o.no} to={`/my/orders/${o.no}`} className={s.cardLink}>
              <Card>
                <div className={s.orderRow}>
                  {first?.imageUrl ? (
                    <img src={first.imageUrl} alt={first.name} className={s.thumb} />
                  ) : (
                    <div className={s.thumb} />
                  )}
                  <div className={s.orderInfo}>
                    <div className={s.row}>
                      <span className={s.muted}>{o.date}</span>
                      <span className={s.muted}>{o.status}</span>
                    </div>
                    <p>{label}</p>
                    <p className={s.strong}>{orderTotal(o).toLocaleString()}원</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
}
