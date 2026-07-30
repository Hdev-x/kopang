import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCart } from "../../api/cart";
import { getUserAddress, getUserAddresses, addAddress, type UserAddressResponse } from "../../api/auth";
import { createOrder } from "../../api/order";
import { getPointBalance } from "../../api/point";
import { getMyCoupons } from "../../api/coupon";
import { getMembershipStatus } from "../../api/membership";
import { calculateShippingFee } from "../../utils/shipping";
import type { CartItem } from "../../types/cart";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebCheckoutPage.module.css";

declare global {
  interface Window {
    daum?: any;
  }
}

const CLIENT_KEY = "test_ck_nRQoOaPz8LNMgv7d5bDPVy47BMw6";

export function WebCheckoutPage() {
  const location = useLocation();
  const stateSelectedItems = (location.state as { selectedItems?: CartItem[] } | null)?.selectedItems;

  const [items, setItems] = useState<CartItem[]>([]);
  const [pay, setPay] = useState("신용/체크카드");
  const [pointInput, setPointInput] = useState("");
  const [availablePoint, setAvailablePoint] = useState(0);
  const [myCoupons, setMyCoupons] = useState<any[]>([]);
  const [selectedUserCouponId, setSelectedUserCouponId] = useState("");

  const [selectedAddress, setSelectedAddress] = useState<UserAddressResponse | null>(null);
  const [addressList, setAddressList] = useState<UserAddressResponse[]>([]);
  const [showSelectModal, setShowSelectModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newReceiver, setNewReceiver] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newZipcode, setNewZipcode] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newDetailAddress, setNewDetailAddress] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [isMembership, setIsMembership] = useState(false);

  const handleSearchAddressInCheckout = () => {
    if (!window.daum || !window.daum.Postcode) {
      window.alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        let fullAddr = data.address;
        let extraAddr = "";

        if (data.addressType === "R") {
          if (data.bname !== "") extraAddr += data.bname;
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
    if (!newReceiver.trim()) return window.alert("수령인을 입력해주세요.");
    if (!newAddress.trim()) return window.alert("주소를 입력해주세요.");

    try {
      const created = await addAddress({
        receiver: newReceiver,
        phone: newPhone || undefined,
        zipcode: newZipcode || undefined,
        address: newAddress,
        detailAddress: newDetailAddress || undefined,
        isDefault: newIsDefault,
      });

      window.alert("새 배송지가 추가되었습니다.");
      setShowAddModal(false);

      const updatedList = await getUserAddresses();
      setAddressList(updatedList || []);
      const newlyAdded = (updatedList || []).find((a) => a.addressId === created.addressId) || (updatedList && updatedList[0]);
      if (newlyAdded) {
        setSelectedAddress(newlyAdded);
      }
      setShowSelectModal(false);
    } catch {
      window.alert("배송지 저장 중 오류가 발생했습니다.");
    }
  };

  const loadDefaultAddress = () => {
    getUserAddress()
      .then(setSelectedAddress)
      .catch(() => setSelectedAddress(null));
  };

  useEffect(() => {
    if (stateSelectedItems && stateSelectedItems.length > 0) {
      setItems(stateSelectedItems);
    } else {
      getCart().then(setItems).catch(console.error);
    }
    loadDefaultAddress();
    getPointBalance().then((d) => setAvailablePoint(d.balance)).catch(console.error);
    getMembershipStatus()
      .then((status) => setIsMembership(status?.status === "ACTIVE"))
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
      window.alert("배송지를 선택해주세요.");
      return;
    }
    try {
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
        successUrl: `${window.location.origin}/web/payment/success`,
        failUrl: `${window.location.origin}/web/payment/fail`,
      });
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "주문 처리 중 오류가 발생했습니다.";
      window.alert(errMsg);
    }
  };

  return (
    <WebLayout>
      <div className={styles.container}>
        <div className={styles.pageTitle}>
          <p>ORDER & PAYMENT</p>
          <h1>주문 / 결제</h1>
        </div>

        <div className={styles.checkoutGrid}>
          {/* 왼쪽 입력 영역 */}
          <div className={styles.leftColumn}>
            {/* 배송지 */}
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <h2>배송지 정보</h2>
                <button type="button" className={styles.changeBtn} onClick={handleOpenSelectModal}>
                  {selectedAddress ? "배송지 변경" : "배송지 선택"}
                </button>
              </div>

              {selectedAddress ? (
                <div className={styles.addressCard}>
                  <div className={styles.addressHeader}>
                    <strong>{selectedAddress.receiver}</strong>
                    {selectedAddress.isDefault && <span className={styles.badge}>기본 배송지</span>}
                  </div>
                  {selectedAddress.phone && <p className={styles.mutedText}>{selectedAddress.phone}</p>}
                  <p className={styles.addressText}>
                    [{selectedAddress.zipcode || "우편번호 없음"}] {selectedAddress.address}{" "}
                    {selectedAddress.detailAddress || ""}
                  </p>
                </div>
              ) : (
                <div className={styles.emptyCard}>
                  <p>등록된 배송지가 없습니다.</p>
                  <button type="button" className={styles.addBtn} onClick={handleOpenSelectModal}>
                    배송지 선택 / 추가하기
                  </button>
                </div>
              )}
            </section>

            {/* 주문 상품 */}
            <section className={styles.sectionBlock}>
              <h2>주문 상품 ({items.length}개)</h2>
              <div className={styles.itemList}>
                {items.map((it) => (
                  <div key={it.itemId} className={styles.itemRow}>
                    <img src={it.imageUrl} alt={it.name} />
                    <div className={styles.itemMeta}>
                      <strong>{it.name}</strong>
                      <span>수량: {it.quantity}개</span>
                    </div>
                    <div className={styles.itemPrice}>
                      {(it.price * it.quantity).toLocaleString()}원
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 쿠폰 / 포인트 */}
            <section className={styles.sectionBlock}>
              <h2>할인 혜택 (쿠폰 / 포인트)</h2>
              <div className={styles.fieldGroup}>
                <div className={styles.field}>
                  <label htmlFor="coupon-select">쿠폰 할인</label>
                  <select
                    id="coupon-select"
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
                  <label htmlFor="point-input">포인트 사용</label>
                  <div className={styles.pointRow}>
                    <input
                      id="point-input"
                      className={styles.input}
                      type="number"
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
                  <p className={styles.hint}>보유 포인트: <strong>{availablePoint.toLocaleString()}P</strong></p>
                </div>
              </div>
            </section>

            {/* 결제 수단 */}
            <section className={styles.sectionBlock}>
              <h2>결제 수단</h2>
              <div className={styles.payGrid}>
                {["신용/체크카드", "가상계좌", "계좌이체", "휴대폰"].map((m) => (
                  <label key={m} className={`${styles.payOption} ${pay === m ? styles.payOptionSelected : ""}`}>
                    <input type="radio" name="pay" checked={pay === m} onChange={() => setPay(m)} />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* 오른쪽 고정 요약 카드 */}
          <aside className={styles.rightColumn}>
            <div className={styles.summaryCard}>
              <h2>최종 결제 금액</h2>

              <dl className={styles.amountList}>
                <div>
                  <dt>상품 총 금액</dt>
                  <dd>{total.toLocaleString()}원</dd>
                </div>
                {couponDiscount > 0 && (
                  <div>
                    <dt>쿠폰 할인</dt>
                    <dd className={styles.discountText}>-{couponDiscount.toLocaleString()}원</dd>
                  </div>
                )}
                {pointUsed > 0 && (
                  <div>
                    <dt>포인트 사용</dt>
                    <dd className={styles.discountText}>-{pointUsed.toLocaleString()}원</dd>
                  </div>
                )}
                <div>
                  <dt>배송비</dt>
                  <dd>
                    {shippingFee === 0 ? (
                      <span className={styles.freeText}>
                        0원 {isMembership ? "(멤버십 혜택 👑)" : "(무료배송)"}
                      </span>
                    ) : (
                      <>
                        +{shippingFee.toLocaleString()}원
                        {shippingInfo.isRemote && (
                          <span className={styles.remoteText}>
                            ({shippingInfo.isJeju ? "제주" : "도서산간"})
                          </span>
                        )}
                      </>
                    )}
                  </dd>
                </div>
              </dl>

              <div className={styles.totalPriceRow}>
                <span>총 결제금액</span>
                <strong>{finalPrice.toLocaleString()}원</strong>
              </div>

              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleCheckout}
                disabled={items.length === 0}
              >
                {finalPrice.toLocaleString()}원 결제하기
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* 배송지 선택 모달 */}
      {showSelectModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSelectModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>배송지 선택</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowSelectModal(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {addressList.length === 0 ? (
                <div className={styles.modalEmpty}>
                  <p>등록된 배송지가 없습니다.</p>
                  <p>아래 [새 배송지 추가] 버튼을 눌러 추가해 주세요.</p>
                </div>
              ) : (
                <div className={styles.addressGrid}>
                  {addressList.map((addr) => (
                    <div
                      key={addr.addressId}
                      className={`${styles.addressListItem} ${selectedAddress?.addressId === addr.addressId ? styles.addressSelected : ""}`}
                      onClick={() => {
                        setSelectedAddress(addr);
                        setShowSelectModal(false);
                      }}
                    >
                      <div className={styles.itemHeader}>
                        <strong>{addr.receiver}</strong>
                        {addr.isDefault && <span className={styles.badge}>기본 배송지</span>}
                      </div>
                      {addr.phone && <p className={styles.mutedText}>{addr.phone}</p>}
                      <p className={styles.addressText}>
                        [{addr.zipcode || "우편번호 없음"}] {addr.address} {addr.detailAddress || ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.addModalBtn} onClick={handleOpenAddModal}>
                + 새 배송지 추가
              </button>
              <button type="button" className={styles.cancelModalBtn} onClick={() => setShowSelectModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새 배송지 추가 모달 */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>새 배송지 추가</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveNewAddress} className={styles.addForm}>
              <div className={styles.formField}>
                <label htmlFor="new-receiver">수령인 (필수)</label>
                <input
                  id="new-receiver"
                  type="text"
                  placeholder="수령인 이름을 입력하세요"
                  value={newReceiver}
                  onChange={(e) => setNewReceiver(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="new-phone">연락처</label>
                <input
                  id="new-phone"
                  type="text"
                  placeholder="010-0000-0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div className={styles.zipcodeRow}>
                <div className={styles.formField} style={{ flex: 1 }}>
                  <label htmlFor="new-zipcode">우편번호</label>
                  <input
                    id="new-zipcode"
                    type="text"
                    placeholder="우편번호"
                    value={newZipcode}
                    readOnly
                  />
                </div>
                <button
                  type="button"
                  className={styles.searchZipBtn}
                  onClick={handleSearchAddressInCheckout}
                >
                  주소 검색
                </button>
              </div>

              <div className={styles.formField}>
                <label htmlFor="new-address">주소 (필수)</label>
                <input
                  id="new-address"
                  type="text"
                  placeholder="주소 검색 버튼을 눌러 주소를 선택하세요"
                  value={newAddress}
                  onClick={handleSearchAddressInCheckout}
                  readOnly
                  required
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="new-detail">상세 주소</label>
                <input
                  id="new-detail"
                  type="text"
                  placeholder="동/호수 등 상세 주소를 입력하세요"
                  value={newDetailAddress}
                  onChange={(e) => setNewDetailAddress(e.target.value)}
                />
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                />
                기본 배송지로 지정
              </label>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelModalBtn} onClick={() => setShowAddModal(false)}>
                  취소
                </button>
                <button type="submit" className={styles.submitModalBtn}>
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WebLayout>
  );
}
