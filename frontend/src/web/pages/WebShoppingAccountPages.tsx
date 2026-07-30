import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Heart, Image, Package, Search, Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatOrderStatus, getOrderDetails, getOrders, type Order } from "../../api/order";
import { getQna, getQnaList } from "../../api/qna";
import { getMyReviews, type Review } from "../../api/review";
import { deleteWishlist, getWishlist, type Wishlist } from "../../api/wishlist";
import type { QnaPost, QnaSummary } from "../../types/qna";
import styles from "./WebShoppingAccountPages.module.css";

export function WebOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getOrders()
      .then((data) => {
        setOrders(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((order) => counts.set(order.orderStatus, (counts.get(order.orderStatus) ?? 0) + 1));
    return counts;
  }, [orders]);

  return (
    <main className={styles.page}>
      <PageHeading title="주문배송목록" description="주문한 상품과 현재 배송 상태를 확인할 수 있어요." />
      <div className={styles.orderSteps}>
        {[
          ["PAID", "결제완료"],
          ["ORDERED", "배송준비"],
          ["SHIPPING", "배송중"],
          ["DELIVERED", "배송완료"],
          ["CONFIRMED", "구매확정"],
        ].map(([status, label], index, list) => (
          <div key={status}>
            <span>{label}</span>
            <strong>{statusCounts.get(status) ?? 0}</strong>
            {index < list.length - 1 && <ChevronRight aria-hidden="true" />}
          </div>
        ))}
      </div>
      {loading ? <AccountStatus label="주문 내역을 불러오는 중이에요." /> : error ? <AccountStatus label="주문 내역을 불러오지 못했어요." /> : orders.length === 0 ? <AccountStatus icon={<Package />} label="아직 주문한 상품이 없어요." action={{ to: "/web/products", label: "상품 둘러보기" }} /> : (
        <div className={styles.orderList}>
          {orders.map((order) => <OrderCard key={order.orderId} order={order} />)}
        </div>
      )}
    </main>
  );
}

export function WebOrderDetailPage({ orderId }: { orderId?: string }) {
  const numericId = Number(orderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Number.isFinite(numericId));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(numericId)) return;
    getOrderDetails(numericId)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [numericId]);

  if (loading) return <main className={styles.page}><AccountStatus label="주문 상세를 불러오는 중이에요." /></main>;
  if (!Number.isFinite(numericId) || error || !order) return <main className={styles.page}><AccountStatus icon={<Package />} label="주문 정보를 확인할 수 없어요." action={{ to: "/web/my/orders", label: "주문 목록으로" }} /></main>;

  return (
    <main className={styles.page}>
      <PageHeading title={`주문 상세 #${order.orderId}`} description={`${formatDate(order.createdAt)} 주문`} />
      <section className={styles.detailSummary}>
        <div><span>주문 상태</span><strong>{formatOrderStatus(order.orderStatus)}</strong></div>
        <div><span>결제 상태</span><strong>{formatOrderStatus(order.paymentStatus)}</strong></div>
        <div><span>결제 금액</span><strong>{order.totalPrice.toLocaleString()}원</strong></div>
      </section>
      <section className={styles.detailSection}>
        <h2>주문 상품</h2>
        {order.items.map((item) => (
          <div className={styles.orderItem} key={item.orderItemId}>
            <ProductImage src={item.imageUrl} name={item.name} />
            <div><Link to={`/web/products/${item.productId}`}>{item.name}</Link><span>{item.quantity}개</span></div>
            <strong>{(item.price * item.quantity).toLocaleString()}원</strong>
          </div>
        ))}
      </section>
      <div className={styles.bottomActions}><Link to="/web/my/orders">목록으로</Link></div>
    </main>
  );
}

export function WebWishlistPage() {
  const [items, setItems] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getWishlist().then(setItems).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const remove = async (productId: number) => {
    await deleteWishlist(productId);
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  return (
    <main className={styles.page}>
      <PageHeading title="찜한 상품" description={`관심 상품 ${items.length}개를 모아봤어요.`} />
      {loading ? <AccountStatus label="찜한 상품을 불러오는 중이에요." /> : error ? <AccountStatus label="찜한 상품을 불러오지 못했어요." /> : items.length === 0 ? <AccountStatus icon={<Heart />} label="아직 찜한 상품이 없어요." action={{ to: "/web/products", label: "상품 둘러보기" }} /> : (
        <div className={styles.wishlistGrid}>
          {items.map((item) => (
            <article key={item.wishlistId} className={styles.wishlistCard}>
              <Link to={`/web/products/${item.productId}`}><ProductImage src={item.imageUrl} name={item.name} /><h2>{item.name}</h2><strong>{(item.discountPrice ?? item.price).toLocaleString()}원</strong></Link>
              <button type="button" onClick={() => remove(item.productId)} aria-label={`${item.name} 찜 해제`}><Trash2 size={17} />삭제</button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export function WebReviewsPage({ write }: { write: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyReviews().catch(() => []), getOrders().catch(() => [])])
      .then(([reviewData, orderData]) => {
        setReviews(reviewData);
        setOrders(orderData);
      })
      .finally(() => setLoading(false));
  }, []);

  const reviewedProductIds = new Set(reviews.map((review) => review.productId));
  const reviewableItems = orders
    .filter((order) => ["DELIVERED", "CONFIRMED"].includes(order.orderStatus))
    .flatMap((order) => order.items)
    .filter((item) => !reviewedProductIds.has(item.productId))
    .filter((item) => item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  return (
    <main className={styles.page}>
      <PageHeading title={write ? "리뷰 남기기" : "내가 남긴 리뷰"} description={write ? "배송이 완료된 상품의 사용 경험을 공유해 주세요." : `작성한 리뷰 ${reviews.length}개를 확인할 수 있어요.`} />
      {write && <label className={styles.search}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="상품명으로 검색" /></label>}
      {loading ? <AccountStatus label="리뷰 정보를 불러오는 중이에요." /> : write ? (
        reviewableItems.length === 0 ? <AccountStatus icon={<Star />} label="작성 가능한 리뷰가 없어요." /> : <div className={styles.reviewList}>{reviewableItems.map((item) => <article key={item.orderItemId}><ProductImage src={item.imageUrl} name={item.name} /><div><h2>{item.name}</h2><p>상품을 사용한 경험을 알려주세요.</p></div><Link to={`/web/products/${item.productId}`}>상품에서 리뷰 작성</Link></article>)}</div>
      ) : reviews.length === 0 ? <AccountStatus icon={<Star />} label="아직 작성한 리뷰가 없어요." action={{ to: "/web/my/reviews/write", label: "작성 가능한 상품 보기" }} /> : (
        <div className={styles.reviewList}>{reviews.map((review) => <article key={review.reviewId}><div className={styles.reviewScore}><Star fill="currentColor" size={18} />{review.rating}</div><div><h2>{review.productName ?? `상품 #${review.productId}`}</h2><p>{review.content}</p><span>{formatDate(review.createdAt)}</span></div><Link to={`/web/products/${review.productId}`}>상품 보기</Link></article>)}</div>
      )}
    </main>
  );
}

export function WebMyInquiriesPage() {
  const [items, setItems] = useState<QnaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getQnaList("GENERAL").then(setItems).catch(() => setItems([])).finally(() => setLoading(false)); }, []);
  return <main className={styles.page}><PageHeading title="나의 문의내역" description="고객센터에 남긴 문의와 답변 상태를 확인하세요." />{loading ? <AccountStatus label="문의 내역을 불러오는 중이에요." /> : items.length === 0 ? <AccountStatus icon={<Search />} label="등록한 문의가 없어요." action={{ to: "/web/support/inquiry", label: "1:1 문의하기" }} /> : <div className={styles.inquiryList}>{items.map((item) => <Link key={item.id} to={`/web/my/inquiries/${item.id}`}><span className={item.status === "답변완료" ? styles.inquiryDone : styles.inquiryWait}>{item.status}</span><strong>{item.title}</strong><time>{formatDate(item.createdAt)}</time><ChevronRight /></Link>)}</div>}</main>;
}

export function WebMyInquiryDetailPage({ inquiryId }: { inquiryId?: string }) {
  const [post, setPost] = useState<QnaPost | null>(null);
  const [loading, setLoading] = useState(true);
  const numericId = Number(inquiryId);
  useEffect(() => { if (!Number.isFinite(numericId)) return; getQna(numericId).then(setPost).catch(() => setPost(null)).finally(() => setLoading(false)); }, [numericId]);
  if (loading) return <main className={styles.page}><AccountStatus label="문의 내용을 불러오는 중이에요." /></main>;
  if (!post) return <main className={styles.page}><AccountStatus label="문의 내용을 찾을 수 없어요." action={{ to: "/web/my/inquiries", label: "목록으로" }} /></main>;
  return <main className={styles.page}><PageHeading title="문의 상세" description={`${formatDate(post.createdAt)} 등록`} /><article className={styles.inquiryDetail}><header><span className={post.status === "답변완료" ? styles.inquiryDone : styles.inquiryWait}>{post.status}</span><h2>{post.title}</h2></header><section><strong>문의 내용</strong><p>{post.content}</p></section><section className={styles.answer}><strong>고객센터 답변</strong><p>{post.answerContent ?? post.answer?.content ?? "담당자가 답변을 준비하고 있어요."}</p></section></article><div className={styles.bottomActions}><Link to="/web/my/inquiries">목록으로</Link></div></main>;
}

function OrderCard({ order }: { order: Order }) {
  const representative = order.items[0];
  return (
    <article className={styles.orderCard}>
      <header><div><strong>{formatDate(order.createdAt)}</strong><span>주문번호 {order.orderId}</span></div><Link to={`/web/my/orders/${order.orderId}`}>주문 상세 <ChevronRight size={17} /></Link></header>
      <div className={styles.orderCardBody}>
        <ProductImage src={representative?.imageUrl} name={representative?.name ?? "주문 상품"} />
        <div><span className={styles.statusBadge}>{formatOrderStatus(order.orderStatus)}</span><h2>{representative?.name ?? "주문 상품"}{order.items.length > 1 ? ` 외 ${order.items.length - 1}개` : ""}</h2><p>총 {order.items.reduce((sum, item) => sum + item.quantity, 0)}개</p></div>
        <strong>{order.totalPrice.toLocaleString()}원</strong>
      </div>
    </article>
  );
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return <header className={styles.heading}><h1>{title}</h1><p>{description}</p></header>;
}

function AccountStatus({ icon, label, action }: { icon?: React.ReactNode; label: string; action?: { to: string; label: string } }) {
  return <div className={styles.empty}>{icon}<strong>{label}</strong>{action && <Link to={action.to}>{action.label}</Link>}</div>;
}

function ProductImage({ src, name }: { src?: string; name: string }) {
  return src ? <img className={styles.productImage} src={src} alt={name} /> : <div className={`${styles.productImage} ${styles.imageFallback}`}><Image size={28} /><span>KOPANG</span></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
