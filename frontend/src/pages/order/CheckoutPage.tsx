import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { getCart } from "../../api/cart";
import { getUserAddress, getUserAddresses, addAddress, type UserAddressResponse } from "../../api/auth";
import { createOrder } from "../../api/order";
import { getPointBalance } from "../../api/point";
import { getMyCoupons } from "../../api/coupon";
import { getMembershipStatus } from "../../api/membership";
import { calculateShippingFee } from "../../utils/shipping";
import type { CartItem } from "../../types/cart";
import styles from "./CheckoutPage.module.css";

declare global {
  interface Window {
    daum?: any;
  }
}

const CLIENT_KEY = "test_ck_nRQoOaPz8LNMgv7d5bDPVy47BMw6";

export function CheckoutPage() {
  const location = useLocation();
  const stateSelectedItems = (location.state as { selectedItems?: CartItem[] } | null)?.selectedItems;

  const [items, setItems] = useState<CartItem[]>([]);
  const [pay, setPay] = useState("신용/체크카드");
  const [pointInput, setPointInput] = useState("");
  const [availablePoint, setAvailablePoint] = useState(0);
  const [myCoupons, setMyCoupons] = useState<any[]>([]);
  const [selectedUserCouponId, setSelectedUserCouponId] = useState("");

  // 배송지 관련 상태
  const [selectedAddress, setSelectedAddress] = useState<UserAddressResponse | null>(null);
  const [addressList, setAddressList] = useState<UserAddressResponse[]>([]);
  const [showSelectModal, setShowSelectModal] = useState(false);

  // 새 배송지 추가 모달 관련 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReceiver, setNewReceiver] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newZipcode, setNewZipcode] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newDetailAddress, setNewDetailAddress] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);

  const handleSearchAddressInCheckout = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        let fullAddr = data.address;
        let extraAddr = "";

        if (data.addressType === "R") {
          if (data.bname !== "") {
            extraAddr += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddr += extraAddr !== "" ? `, ${data.buildingName}` : data.buildingName;
          }
          fullAddr += extraAddr !== "" ? ` (${extraAddr})` : "";
        }

        setNewZipcode(data.zonecode || "");
        setNewAddress(fullAddr || "");
      },
    }).open();
  };

  const handleOpenAddModal = () => {
    setNewReceiver("");
    setNewPhone("");
    setNewZipcode("");
    setNewAddress("");
    setNewDetailAddress("");
    setNewIsDefault(addressList.length === 0);
    setShowAddModal(true);
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReceiver.trim()) return alert("수령인을 입력해주세요.");
    if (!newAddress.trim()) return alert("주소를 입력해주세요.");

    try {
      const created = await addAddress({
        receiver: newReceiver,
        phone: newPhone || undefined,
        zipcode: newZipcode || undefined,
        address: newAddress,
        detailAddress: newDetailAddress || undefined,
        isDefault: newIsDefault,
      });

      alert("새 배송지가 추가되었습니다.");
      setShowAddModal(false);

      const updatedList = await getUserAddresses();
      setAddressList(updatedList || []);
      const newlyAdded = (updatedList || []).find((a) => a.addressId === created.addressId) || (updatedList && updatedList[0]);
      if (newlyAdded) {
        setSelectedAddress(newlyAdded);
      }
      setShowSelectModal(false);
    } catch (err) {
      alert("배송지 저장 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  const loadDefaultAddress = () => {
    getUserAddress()
      .then((addr) => {
        setSelectedAddress(addr);
      })
      .catch(console.error);
  };

  const [isMembership, setIsMembership] = useState(false);

  useEffect(() => {
    if (stateSelectedItems && stateSelectedItems.length > 0) {
      setItems(stateSelectedItems);
    } else {
      getCart().then(setItems).catch(console.error);
    }
    loadDefaultAddress();
    getPointBalance().then((d) => setAvailablePoint(d.balance)).catch(console.error);
    getMembershipStatus()
      .then((status) => setIsMembership(Boolean(status && (status.status === "ACTIVE" || status.status === "CANCELLED"))))
      .catch(() => setIsMembership(false));
    getMyCoupons()
      .then((list) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const available = list.filter((c) => {
          if (c.used) return false;
          if (!c.expiresAt) return true;
          return new Date(c.expiresAt) >= today;
        });
        setMyCoupons(available);
        // 장바구니 방치 5% 할인 쿠폰(couponId=3 또는 5% RATE 쿠폰)이 존재하면 자동 선택
        const autoCoupon = available.find(
          (c) => c.couponId === 3 || (c.discountType === "RATE" && c.discountValue === 5)
        );
        if (autoCoupon) {
          setSelectedUserCouponId(String(autoCoupon.userCouponId));
        }
      })
      .catch(console.error);
  }, []);

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  const selectedCoupon = myCoupons.find((c) => c.userCouponId === Number(selectedUserCouponId));
  let couponDiscount = 0;
  if (selectedCoupon) {
    if (selectedCoupon.discountType === "RATE") {
      couponDiscount = Math.floor(total * (selectedCoupon.discountValue / 100));
    } else {
      couponDiscount = selectedCoupon.discountValue;
    }
  }

  const shippingInfo = calculateShippingFee({
    isMembership,
    zipcode: selectedAddress?.zipcode,
    address: selectedAddress?.address,
  });
  const shippingFee = shippingInfo.fee;

  const afterCoupon = Math.max(0, total - couponDiscount);
  const totalBeforePoint = afterCoupon + shippingFee;
  const maxPoint = Math.min(availablePoint, totalBeforePoint);
  const pointUsed = Math.min(Math.max(0, Number(pointInput) || 0), maxPoint);
  const finalPrice = totalBeforePoint - pointUsed;

  const handleOpenSelectModal = () => {
    getUserAddresses()
      .then((list) => {
        setAddressList(list || []);
        setShowSelectModal(true);
      })
      .catch(console.error);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!selectedAddress) {
      alert("배송지를 선택해주세요.");
      return;
    }
    try {
      // 금액 위변조 에러 방지: 쿠폰이나 포인트를 변경한 후 결제를 다시 시도할 때
      // 기존 PENDING 주문의 총금액과 일치하지 않는 문제를 방지하기 위해 매 결제 요청마다 새로운 주문을 생성합니다.
      const orderId = await createOrder({
        totalPrice: finalPrice,
        usedPoint: pointUsed,
        userCouponId: selectedUserCouponId ? Number(selectedUserCouponId) : undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          price: it.price,
        })),
      });
      sessionStorage.setItem("checkout_pending_order_id", String(orderId));

      const tossPayments = (
        window as unknown as {
          TossPayments: (key: string) => {
            requestPayment: (
              method: string,
              opts: Record<string, unknown>
            ) => Promise<void>;
          };
        }
      ).TossPayments(CLIENT_KEY);

      const firstItemName = items[0]?.name ?? "상품";
      const orderName =
        items.length > 1
          ? `${firstItemName} 외 ${items.length - 1}건`
          : firstItemName;

      await tossPayments.requestPayment("카드", {
        amount: finalPrice,
        orderId: `ORD-${orderId}`,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "주문 처리 중 오류가 발생했습니다.";
      alert(errMsg);
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <PageHeader title="주문/결제" />

        {/* ── 배송지 ── */}
        <div className={styles.sectionHeader}>
          <p className={styles.section}>배송지</p>
          <button type="button" className={styles.changeBtn} onClick={handleOpenSelectModal}>
            {selectedAddress ? "변경" : "선택"}
          </button>
        </div>
        {selectedAddress ? (
          <div className={styles.card}>
            <p className={styles.name}>
              {selectedAddress.receiver}{" "}
              {selectedAddress.isDefault && <span className={styles.badge}>기본</span>}
            </p>
            {selectedAddress.phone && <p className={styles.muted}>{selectedAddress.phone}</p>}
            <p className={styles.muted}>
              [{selectedAddress.zipcode || "우편번호 없음"}] {selectedAddress.address}{" "}
              {selectedAddress.detailAddress || ""}
            </p>
          </div>
        ) : (
          <div className={styles.cardEmpty}>
            <p className={styles.emptyText}>등록된 배송지가 없습니다.</p>
            <Button size="sm" onClick={handleOpenSelectModal}>
              배송지 선택 / 추가
            </Button>
          </div>
        )}

        {/* ── 주문 상품 ── */}
        <p className={styles.section}>주문 상품</p>
        <div className={styles.card}>
          {items.map((it) => (
            <div key={it.itemId} className={styles.orderItem}>
              <span className={styles.orderItemName}>{it.name}</span>
              <span className={styles.orderItemQty}>{it.quantity}개</span>
              <span className={styles.orderItemPrice}>
                {(it.price * it.quantity).toLocaleString()}원
              </span>
            </div>
          ))}
        </div>

        {/* ── 쿠폰 / 포인트 ── */}
        <p className={styles.section}>쿠폰 / 포인트</p>
        <div className={styles.card}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>쿠폰</span>
            <select
              className={styles.select}
              value={selectedUserCouponId}
              onChange={(e) => setSelectedUserCouponId(e.target.value)}
            >
              <option value="">적용 안 함</option>
              {myCoupons.map((c) => {
                const discountText = c.discountType === "RATE" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}원`;
                return (
                  <option key={c.userCouponId} value={c.userCouponId}>
                    {c.name} ({discountText} 할인)
                  </option>
                );
              })}
            </select>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>포인트</span>
            <div className={styles.pointRow}>
              <input
                className={styles.pointInput}
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={pointInput}
                onChange={(e) =>
                  setPointInput(
                    String(Math.min(Number(e.target.value) || 0, maxPoint))
                  )
                }
              />
              <button
                type="button"
                className={styles.allBtn}
                onClick={() => setPointInput(String(maxPoint))}
              >
                전액사용
              </button>
            </div>
          </div>
          <p className={styles.pointHint}>보유 {availablePoint.toLocaleString()}P</p>
        </div>

        {/* ── 결제 수단 ── */}
        <p className={styles.section}>결제 수단</p>
        <div className={styles.card}>
          {["신용/체크카드", "가상계좌", "계좌이체", "휴대폰"].map((m) => (
            <label key={m} className={styles.radio}>
              <input type="radio" name="pay" checked={pay === m} onChange={() => setPay(m)} />
              {m}
            </label>
          ))}
        </div>

        {/* ── 금액 요약 + 결제 버튼 ── */}
        <div className={styles.summary}>
          <div className={styles.amountRow}>
            <span>상품금액</span>
            <span>{total.toLocaleString()}원</span>
          </div>
          {couponDiscount > 0 && (
            <div className={styles.amountRow}>
              <span>쿠폰 할인</span>
              <span className={styles.discount}>-{couponDiscount.toLocaleString()}원</span>
            </div>
          )}
          {pointUsed > 0 && (
            <div className={styles.amountRow}>
              <span>포인트 사용</span>
              <span className={styles.discount}>-{pointUsed.toLocaleString()}원</span>
            </div>
          )}
          <div className={styles.amountRow}>
            <span>배송비</span>
            <span>
              {shippingFee === 0 ? (
                <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>
                  0원 {isMembership ? "(멤버십 혜택 👑)" : "(무료배송)"}
                </span>
              ) : (
                <>
                  +{shippingFee.toLocaleString()}원
                  {shippingInfo.isRemote && (
                    <span style={{ fontSize: "12px", color: "#e53e3e", marginLeft: "4px" }}>
                      ({shippingInfo.isJeju ? "제주" : "도서산간"})
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
          <hr className={styles.divider} />
          <div className={styles.amountTotal}>
            <span className={styles.amountTotalLabel}>총 결제금액</span>
            <strong className={styles.amountTotalValue}>
              {finalPrice.toLocaleString()}원
            </strong>
          </div>
          <Button
            className={styles.pay}
            onClick={handleCheckout}
            disabled={items.length === 0}
          >
            {finalPrice.toLocaleString()}원 결제하기
          </Button>
        </div>
      </div>

      {/* 배송지 선택 모달 */}
      {showSelectModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSelectModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>배송지 선택</h3>
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={handleOpenSelectModal}
                title="새로고침"
              >
                🔄 새로고침
              </button>
            </div>

            <div className={styles.modalBody}>
              {addressList.length === 0 ? (
                <div className={styles.modalEmpty}>
                  <p className={styles.muted}>등록된 배송지가 없습니다.</p>
                  <p className={styles.muted}>배송지 관리를 눌러 새 주소를 추가해주세요.</p>
                </div>
              ) : (
                <div className={styles.addressList}>
                  {addressList.map((addr) => (
                    <div
                      key={addr.addressId}
                      className={`${styles.addressItem} ${selectedAddress?.addressId === addr.addressId ? styles.selectedItem : ""
                        }`}
                      onClick={() => {
                        setSelectedAddress(addr);
                        setShowSelectModal(false);
                      }}
                    >
                      <div className={styles.addressItemHeader}>
                        <strong>{addr.receiver}</strong>
                        {addr.isDefault && <span className={styles.badge}>기본</span>}
                        {selectedAddress?.addressId === addr.addressId && (
                          <span className={styles.selectedBadge}>선택됨</span>
                        )}
                      </div>
                      {addr.phone && <p className={styles.addressItemPhone}>{addr.phone}</p>}
                      <p className={styles.addressItemText}>
                        [{addr.zipcode || "우편번호 없음"}] {addr.address} {addr.detailAddress || ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalButtons}>
              <Button
                type="button"
                variant="ghost"
                onClick={handleOpenAddModal}
              >
                + 새 배송지 추가
              </Button>
              <Button type="button" onClick={() => setShowSelectModal(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 새 배송지 추가 모달 */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>새 배송지 추가</h3>
            <form onSubmit={handleSaveNewAddress} className={styles.addForm}>
              <Input
                label="수령인 (필수)"
                placeholder="수령인 이름을 입력하세요"
                value={newReceiver}
                onChange={(e) => setNewReceiver(e.target.value)}
                required
              />
              <Input
                label="연락처"
                placeholder="010-0000-0000"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="우편번호"
                    placeholder="우편번호"
                    value={newZipcode}
                    onChange={(e) => setNewZipcode(e.target.value)}
                    readOnly
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSearchAddressInCheckout}
                  style={{ marginBottom: "16px", height: "46px", flexShrink: 0 }}
                >
                  주소 검색
                </Button>
              </div>
              <Input
                label="주소 (필수)"
                placeholder="주소 검색 버튼을 눌러 주소를 선택하세요"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                onClick={handleSearchAddressInCheckout}
                readOnly
                required
              />
              <Input
                label="상세 주소"
                placeholder="동/호수 등 상세 주소를 입력하세요"
                value={newDetailAddress}
                onChange={(e) => setNewDetailAddress(e.target.value)}
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                />
                기본 배송지로 지정
              </label>

              <div className={styles.modalButtons}>
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                  취소
                </Button>
                <Button type="submit">저장하기</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
