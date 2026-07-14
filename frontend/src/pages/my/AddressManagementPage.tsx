import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type UserAddressResponse,
} from "../../api/auth";
import s from "./AddressManagementPage.module.css";

export function AddressManagementPage() {
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // 등록/수정 모달 관련 상태
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);

  // 폼 입력 상태
  const [receiver, setReceiver] = useState("");
  const [phone, setPhone] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [isDefaultVal, setIsDefaultVal] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await getUserAddresses();
      setAddresses(data || []);
    } catch (e) {
      console.error("배송지 목록 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setTargetId(null);
    setReceiver("");
    setPhone("");
    setZipcode("");
    setAddress("");
    setDetailAddress("");
    setIsDefaultVal(addresses.length === 0); // 첫 배송지면 기본 배송지로 강제 설정
    setShowModal(true);
  };

  const openEditModal = (addr: UserAddressResponse) => {
    setIsEditMode(true);
    setTargetId(addr.addressId);
    setReceiver(addr.receiver);
    setPhone(addr.phone || "");
    setZipcode(addr.zipcode || "");
    setAddress(addr.address);
    setDetailAddress(addr.detailAddress || "");
    setIsDefaultVal(addr.isDefault);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiver.trim()) return alert("수령인을 입력해주세요.");
    if (!address.trim()) return alert("주소를 입력해주세요.");

    const params = {
      receiver,
      phone: phone || undefined,
      zipcode: zipcode || undefined,
      address,
      detailAddress: detailAddress || undefined,
      isDefault: isDefaultVal,
    };

    try {
      if (isEditMode && targetId !== null) {
        await updateAddress(targetId, params);
        alert("배송지가 수정되었습니다.");
      } else {
        await addAddress(params);
        alert("배송지가 추가되었습니다.");
      }
      closeModal();
      fetchAddresses();
    } catch (err) {
      alert("배송지 저장 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  const handleDelete = async (addressId: number, isDefaultAddr: boolean) => {
    if (!window.confirm("이 배송지를 삭제하시겠습니까?")) return;
    try {
      await deleteAddress(addressId);
      alert("배송지가 삭제되었습니다.");
      fetchAddresses();
    } catch (e) {
      alert("배송지 삭제에 실패했습니다.");
      console.error(e);
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      await setDefaultAddress(addressId);
      alert("기본 배송지로 변경되었습니다.");
      fetchAddresses();
    } catch (e) {
      alert("기본 배송지 설정에 실패했습니다.");
      console.error(e);
    }
  };

  return (
    <Layout>
      <PageHeader title="배송지 관리" />

      <div className={s.container}>
        <div className={s.actionHeader}>
          <p className={s.subtitle}>자주 쓰는 배송지를 관리할 수 있습니다.</p>
          <Button variant="ghost" size="sm" onClick={openAddModal}>
            + 새 배송지 추가
          </Button>
        </div>

        {loading ? (
          <div className={s.loading}>로딩 중...</div>
        ) : addresses.length === 0 ? (
          <div className={s.empty}>등록된 배송지가 없습니다. 새 배송지를 추가해보세요.</div>
        ) : (
          <div className={s.list}>
            {addresses.map((addr) => (
              <div key={addr.addressId} className={`${s.card} ${addr.isDefault ? s.defaultCard : ""}`}>
                <div className={s.cardHeader}>
                  <strong className={s.receiver}>{addr.receiver}</strong>
                  {addr.isDefault && <span className={s.badge}>기본 배송지</span>}
                </div>

                {addr.phone && <p className={s.phone}>{addr.phone}</p>}
                <p className={s.address}>
                  [{addr.zipcode || "우편번호 없음"}] {addr.address} {addr.detailAddress}
                </p>

                <div className={s.cardActions}>
                  <button type="button" className={s.textBtn} onClick={() => openEditModal(addr)}>
                    수정
                  </button>
                  <button
                    type="button"
                    className={s.textBtn}
                    onClick={() => handleDelete(addr.addressId, addr.isDefault)}
                  >
                    삭제
                  </button>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      className={s.defaultBtn}
                      onClick={() => handleSetDefault(addr.addressId)}
                    >
                      기본 배송지 설정
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 새 배송지 추가 / 수정 모달 */}
      {showModal && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={s.modalTitle}>{isEditMode ? "배송지 수정" : "새 배송지 추가"}</h3>
            <form onSubmit={handleSubmit} className={s.form}>
              <Input
                label="수령인 (필수)"
                placeholder="수령인 이름을 입력하세요"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                required
              />
              <Input
                label="연락처"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="우편번호"
                placeholder="우편번호"
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
              />
              <Input
                label="주소 (필수)"
                placeholder="도로명 또는 지번 주소"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <Input
                label="상세 주소"
                placeholder="나머지 주소를 입력하세요"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
              />

              <label className={s.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isDefaultVal}
                  onChange={(e) => setIsDefaultVal(e.target.checked)}
                  disabled={isEditMode && isDefaultVal} // 이미 기본 배송지라면 체크 해제 불가 (다른 곳을 지정해서 풀어야 함)
                />
                기본 배송지로 지정
              </label>

              <div className={s.modalButtons}>
                <Button type="button" variant="ghost" onClick={closeModal}>
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
