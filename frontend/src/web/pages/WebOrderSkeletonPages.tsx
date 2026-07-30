import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, CreditCard, MapPin, Package, XCircle } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { addAddress, getUserAddress, getUserAddresses, type UserAddressResponse } from "../../api/auth";
import { getCart } from "../../api/cart";
import { client } from "../../api/client";
import { getMyCoupons, type UserCouponResponse } from "../../api/coupon";
import { getMembershipStatus } from "../../api/membership";
import { createOrder, getOrderDetails } from "../../api/order";
import { getPointBalance } from "../../api/point";
import type { CartItem } from "../../types/cart";
import { calculateShippingFee } from "../../utils/shipping";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebOrderPages.module.css";

const CLIENT_KEY = "test_ck_nRQoOaPz8LNMgv7d5bDPVy47BMw6";

export function WebCheckoutPage() {
  const location = useLocation();
  const stateItems = (location.state as { selectedItems?: CartItem[] } | null)?.selectedItems;
  const [items, setItems] = useState<CartItem[]>(stateItems ?? []);
  const [address, setAddress] = useState<UserAddressResponse | null>(null);
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
  const [addressModal, setAddressModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [coupons, setCoupons] = useState<UserCouponResponse[]>([]);
  const [couponId, setCouponId] = useState("");
  const [points, setPoints] = useState(0);
  const [pointInput, setPointInput] = useState("");
  const [membership, setMembership] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const itemPromise = stateItems?.length ? Promise.resolve(stateItems) : getCart();
    Promise.all([
      itemPromise,
      getUserAddress().catch(() => null),
      getUserAddresses().catch(() => []),
      getMyCoupons().catch(() => []),
      getPointBalance().catch(() => ({ balance: 0 })),
      getMembershipStatus().catch(() => null),
    ]).then(([cartItems, defaultAddress, addressList, couponList, pointData, membershipData]) => {
      setItems(cartItems);
      setAddress(defaultAddress);
      setAddresses(addressList);
      setCoupons(couponList.filter((coupon) => !coupon.used && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())));
      setPoints(pointData.balance);
      setMembership(membershipData?.status === "ACTIVE");
    });
  }, [stateItems]);

  const productTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedCoupon = coupons.find((coupon) => coupon.userCouponId === Number(couponId));
  const couponDiscount = selectedCoupon ? Math.min(productTotal, selectedCoupon.discountType === "RATE" ? Math.floor(productTotal * selectedCoupon.discountValue / 100) : selectedCoupon.discountValue) : 0;
  const shipping = calculateShippingFee({ isMembership: membership, zipcode: address?.zipcode, address: address?.address });
  const maxPoints = Math.min(points, Math.max(0, productTotal - couponDiscount + shipping.fee));
  const usedPoints = Math.min(maxPoints, Math.max(0, Number(pointInput) || 0));
  const total = Math.max(0, productTotal - couponDiscount + shipping.fee - usedPoints);

  const checkout = async () => {
    if (!address) {
      setAddressModal(true);
      return;
    }
    if (!items.length || submitting) return;
    setSubmitting(true);
    try {
      const orderId = await createOrder({
        totalPrice: total,
        usedPoint: usedPoints,
        userCouponId: couponId ? Number(couponId) : undefined,
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.price })),
      });
      sessionStorage.setItem("checkout_pending_order_id", String(orderId));
      const toss = (window as unknown as { TossPayments: (key: string) => { requestPayment: (method: string, options: Record<string, unknown>) => Promise<void> } }).TossPayments(CLIENT_KEY);
      await toss.requestPayment("카드", {
        amount: total,
        orderId: `ORD-${orderId}`,
        orderName: items.length > 1 ? `${items[0].name} 외 ${items.length - 1}건` : items[0].name,
        successUrl: `${window.location.origin}/web/payment/success`,
        failUrl: `${window.location.origin}/web/payment/fail`,
      });
    } catch (error) {
      window.alert(readErrorMessage(error, "결제를 시작하지 못했어요."));
      setSubmitting(false);
    }
  };

  return (
    <WebLayout>
      <header className={styles.heading}><p>CHECKOUT</p><h1>주문/결제</h1><span>주문 상품과 혜택을 확인한 뒤 결제를 진행해 주세요.</span></header>
      <div className={styles.checkoutLayout}>
        <main className={styles.checkoutMain}>
          <CheckoutSection title="배송지" action={<button type="button" onClick={() => setAddressModal(true)}>{address ? "변경" : "선택"}</button>}>
            {address ? <AddressCard address={address} /> : <button type="button" className={styles.addressEmpty} onClick={() => setAddressModal(true)}><MapPin /><span>배송지를 선택하거나 새로 등록해 주세요.</span><ChevronRight /></button>}
          </CheckoutSection>
          <CheckoutSection title={`주문 상품 ${items.length}개`}>
            {items.map((item) => <div className={styles.checkoutItem} key={item.itemId}><ProductThumb item={item} /><div><strong>{item.name}</strong><span>{item.quantity}개</span></div><b>{(item.price * item.quantity).toLocaleString()}원</b></div>)}
          </CheckoutSection>
          <CheckoutSection title="쿠폰·포인트">
            <label className={styles.field}><span>쿠폰</span><select value={couponId} onChange={(event) => setCouponId(event.target.value)}><option value="">적용 안 함</option>{coupons.map((coupon) => <option key={coupon.userCouponId} value={coupon.userCouponId}>{coupon.name} ({coupon.discountType === "RATE" ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}원`})</option>)}</select></label>
            <label className={styles.field}><span>포인트</span><div><input inputMode="numeric" value={pointInput} onChange={(event) => setPointInput(event.target.value.replace(/\D/g, ""))} placeholder={`최대 ${maxPoints.toLocaleString()}P`} /><button type="button" onClick={() => setPointInput(String(maxPoints))}>전액 사용</button></div></label>
          </CheckoutSection>
          <CheckoutSection title="결제 수단"><label className={styles.paymentMethod}><input type="radio" checked readOnly /><CreditCard /><span><strong>신용·체크카드</strong><small>Toss Payments 안전결제</small></span></label></CheckoutSection>
        </main>
        <aside className={styles.summary}>
          <h2>최종 결제 금액</h2>
          <dl><dt>상품 금액</dt><dd>{productTotal.toLocaleString()}원</dd><dt>쿠폰 할인</dt><dd>-{couponDiscount.toLocaleString()}원</dd><dt>포인트 사용</dt><dd>-{usedPoints.toLocaleString()}원</dd><dt>배송비</dt><dd>{shipping.fee.toLocaleString()}원</dd></dl>
          {shipping.badge && <p>{shipping.badge}</p>}
          <div><span>총 결제금액</span><strong>{total.toLocaleString()}원</strong></div>
          <button type="button" disabled={!items.length || submitting} onClick={checkout}>{submitting ? "결제 준비 중..." : `${total.toLocaleString()}원 결제하기`}</button>
          <small>주문 내용을 확인했으며 결제 진행에 동의합니다.</small>
        </aside>
      </div>
      {addressModal && <AddressSelectModal addresses={addresses} selected={address} onSelect={(selected) => { setAddress(selected); setAddressModal(false); }} onAdd={() => { setAddressModal(false); setAddModal(true); }} onClose={() => setAddressModal(false)} />}
      {addModal && <AddressFormModal isFirst={addresses.length === 0} onClose={() => setAddModal(false)} onSaved={(created) => { setAddresses((current) => [...current, created]); setAddress(created); setAddModal(false); }} />}
    </WebLayout>
  );
}

export function WebResumeCheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = Number(orderId);
    if (!Number.isFinite(id)) {
      navigate("/web/cart", { replace: true });
      return;
    }
    getOrderDetails(id).then((order) => {
      navigate("/web/checkout", {
        replace: true,
        state: { selectedItems: order.items.map((item) => ({ itemId: item.orderItemId, productId: item.productId, name: item.name, price: item.price, quantity: item.quantity, imageUrl: item.imageUrl })) },
      });
    }).catch(() => setLoading(false));
  }, [orderId, navigate]);
  return <WebLayout><ResultState icon={<Package />} title={loading ? "결제 정보를 불러오는 중이에요." : "이어갈 주문을 찾지 못했어요."} primary={{ to: "/web/my/orders", label: "주문 내역 보기" }} /></WebLayout>;
}

export function WebPaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ran = useRef(false);
  const [message, setMessage] = useState("결제를 승인하고 있어요.");
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const paymentKey = params.get("paymentKey") ?? "";
    const orderId = params.get("orderId") ?? "";
    const amount = Number(params.get("amount") || 0);
    if (!paymentKey || !orderId || !amount) {
      navigate("/web/payment/fail?code=INVALID_PARAMS&message=" + encodeURIComponent("유효하지 않은 결제 정보입니다."), { replace: true });
      return;
    }
    client.post("/orders/confirm", { paymentKey, orderId, amount }).then(() => {
      sessionStorage.removeItem("checkout_pending_order_id");
      navigate(`/web/order/complete?orderId=${orderId.replace("ORD-", "")}`, { replace: true });
    }).catch((error) => setMessage(readErrorMessage(error, "결제 승인에 실패했어요.")));
  }, [params, navigate]);
  return <WebLayout><ResultState loading title={message} /></WebLayout>;
}

export function WebPaymentFailPage() {
  const [params] = useSearchParams();
  const savedOrderId = sessionStorage.getItem("checkout_pending_order_id");
  return <WebLayout><ResultState icon={<XCircle className={styles.failIcon} />} title="결제를 완료하지 못했어요." description={params.get("message") ?? "결제 정보를 확인한 뒤 다시 시도해 주세요."} badge={params.get("code") ?? undefined} primary={{ to: savedOrderId ? `/web/checkout/resume/${savedOrderId}` : "/web/cart", label: "다시 결제하기" }} secondary={{ to: "/web/cart", label: "장바구니로" }} /></WebLayout>;
}

export function WebOrderCompletePage() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId") ?? "";
  return <WebLayout><ResultState icon={<CheckCircle2 className={styles.successIcon} />} title="주문이 완료됐어요." description={`주문번호 ORD-${orderId}`} primary={{ to: orderId ? `/web/my/orders/${orderId}` : "/web/my/orders", label: "주문 상세 보기" }} secondary={{ to: "/web", label: "쇼핑 계속하기" }} /></WebLayout>;
}

function CheckoutSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className={styles.section}><header><h2>{title}</h2>{action}</header>{children}</section>;
}

function AddressCard({ address }: { address: UserAddressResponse }) {
  return <div className={styles.addressCard}><div><strong>{address.receiver}</strong>{address.isDefault && <span>기본 배송지</span>}</div>{address.phone && <p>{address.phone}</p>}<p>[{address.zipcode ?? "우편번호 없음"}] {address.address} {address.detailAddress}</p></div>;
}

function AddressSelectModal({ addresses, selected, onSelect, onAdd, onClose }: { addresses: UserAddressResponse[]; selected: UserAddressResponse | null; onSelect: (address: UserAddressResponse) => void; onAdd: () => void; onClose: () => void }) {
  return <div className={styles.overlay} onClick={onClose}><section className={styles.modal} onClick={(event) => event.stopPropagation()}><header><h2>배송지 선택</h2><button type="button" onClick={onClose}>닫기</button></header><div className={styles.addressList}>{addresses.length ? addresses.map((address) => <button type="button" key={address.addressId} className={selected?.addressId === address.addressId ? styles.selectedAddress : ""} onClick={() => onSelect(address)}><AddressCard address={address} /></button>) : <div className={styles.modalEmpty}>등록된 배송지가 없어요.</div>}</div><button type="button" className={styles.primaryModalButton} onClick={onAdd}>새 배송지 추가</button></section></div>;
}

function AddressFormModal({ isFirst, onClose, onSaved }: { isFirst: boolean; onClose: () => void; onSaved: (address: UserAddressResponse) => void }) {
  const [form, setForm] = useState({ receiver: "", phone: "", zipcode: "", address: "", detailAddress: "", isDefault: isFirst });
  const [saving, setSaving] = useState(false);
  const searchAddress = () => {
    const postcode = (window as unknown as { daum?: { Postcode: new (options: { oncomplete: (data: { address: string; zonecode: string }) => void }) => { open: () => void } } }).daum?.Postcode;
    if (!postcode) {
      window.alert("주소 검색 서비스를 불러오는 중이에요.");
      return;
    }
    new postcode({ oncomplete: (data) => setForm((current) => ({ ...current, zipcode: data.zonecode, address: data.address })) }).open();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.receiver.trim() || !form.address.trim()) return;
    setSaving(true);
    try {
      onSaved(await addAddress({ ...form, phone: form.phone || undefined, zipcode: form.zipcode || undefined, detailAddress: form.detailAddress || undefined }));
    } catch {
      window.alert("배송지를 저장하지 못했어요.");
      setSaving(false);
    }
  };
  return <div className={styles.overlay} onClick={onClose}><section className={styles.modal} onClick={(event) => event.stopPropagation()}><header><h2>새 배송지 추가</h2><button type="button" onClick={onClose}>닫기</button></header><form className={styles.addressForm} onSubmit={submit}><label>수령인<input required value={form.receiver} onChange={(event) => setForm({ ...form, receiver: event.target.value })} /></label><label>연락처<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="010-0000-0000" /></label><label>우편번호<div><input readOnly value={form.zipcode} /><button type="button" onClick={searchAddress}>주소 검색</button></div></label><label>주소<input required readOnly value={form.address} onClick={searchAddress} /></label><label>상세 주소<input value={form.detailAddress} onChange={(event) => setForm({ ...form, detailAddress: event.target.value })} /></label><label className={styles.checkbox}><input type="checkbox" checked={form.isDefault} disabled={isFirst} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />기본 배송지로 지정</label><button type="submit" className={styles.primaryModalButton} disabled={saving}>{saving ? "저장 중..." : "배송지 저장"}</button></form></section></div>;
}

function ProductThumb({ item }: { item: CartItem }) {
  return item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div className={styles.thumbFallback}><Package /></div>;
}

function ResultState({ loading, icon, title, description, badge, primary, secondary }: { loading?: boolean; icon?: React.ReactNode; title: string; description?: string; badge?: string; primary?: { to: string; label: string }; secondary?: { to: string; label: string } }) {
  return <main className={styles.result}>{loading ? <div className={styles.spinner} /> : icon}<h1>{title}</h1>{description && <p>{description}</p>}{badge && <span>{badge}</span>}<div>{primary && <Link to={primary.to}>{primary.label}</Link>}{secondary && <Link to={secondary.to} className={styles.secondary}>{secondary.label}</Link>}</div></main>;
}

function readErrorMessage(error: unknown, fallback: string) {
  return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback;
}
