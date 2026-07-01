import { Link, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { findOrder, orderTotal, productOf } from "../mocks/orderData";
import s from "./AccountPages.module.css";

export function OrderDetailPage() {
  const { no } = useParams();
  const order = no ? findOrder(no) : undefined;

  if (!order) {
    return (
      <Layout>
        <p className={s.empty}>주문을 찾을 수 없어요.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="주문 상세" />

      <Card>
        <div className={s.row}>
          <span className={s.muted}>주문번호</span>
          <span>{order.no}</span>
        </div>
        <div className={s.row}>
          <span className={s.muted}>주문일</span>
          <span>{order.date}</span>
        </div>
      </Card>

      {/* 배송현황 */}
      <h2 className={s.section}>배송현황</h2>
      <Card>
        <div className={s.track}>
          {order.tracking.map((t) => (
            <div key={t.step} className={`${s.trackStep} ${t.done ? s.trackDone : ""}`}>
              <span className={s.dot} />
              <span>{t.step}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 주문 상품 (상품 누르면 상세로) */}
      <h2 className={s.section}>주문 상품</h2>
      <div className={s.list}>
        {order.items.map((it) => {
          const p = productOf(it.productId);
          return (
            <Link key={it.productId} to={`/products/${it.productId}`} className={s.cardLink}>
              <Card>
                <div className={s.orderRow}>
                  {p?.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className={s.thumb} />
                  ) : (
                    <div className={s.thumb} />
                  )}
                  <div className={s.orderInfo}>
                    <div className={s.row}>
                      <span>{p?.name ?? "상품"}</span>
                      <span className={s.muted}>{it.qty}개</span>
                    </div>
                    <p className={s.strong}>
                      {((p?.price ?? 0) * it.qty).toLocaleString()}원
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className={s.totalRow}>
        <span>총 결제금액</span>
        <span>{orderTotal(order).toLocaleString()}원</span>
      </div>
    </Layout>
  );
}
