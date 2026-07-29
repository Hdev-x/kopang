import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { addAddress, deleteAddress, getUserAddresses, setDefaultAddress, updateAddress, type UserAddressResponse } from "../../api/auth";
import styles from "./WebAddressBook.module.css";

type AddressForm = {
  receiver: string;
  phone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
  isDefault: boolean;
};

const EMPTY_FORM: AddressForm = { receiver: "", phone: "", zipcode: "", address: "", detailAddress: "", isDefault: false };

export function WebAddressBook() {
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = () => getUserAddresses().then(setAddresses);
  useEffect(() => { reload().catch(() => setAddresses([])).finally(() => setLoading(false)); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, isDefault: addresses.length === 0 });
    setModalOpen(true);
  };
  const openEdit = (address: UserAddressResponse) => {
    setEditingId(address.addressId);
    setForm({ receiver: address.receiver, phone: address.phone ?? "", zipcode: address.zipcode ?? "", address: address.address, detailAddress: address.detailAddress ?? "", isDefault: address.isDefault });
    setModalOpen(true);
  };
  const searchAddress = () => {
    const postcode = (window as unknown as { daum?: { Postcode: new (options: { oncomplete: (data: { address: string; zonecode: string }) => void }) => { open: () => void } } }).daum?.Postcode;
    if (!postcode) {
      window.alert("주소 검색 서비스를 불러오는 중이에요.");
      return;
    }
    new postcode({ oncomplete: (data) => setForm((current) => ({ ...current, zipcode: data.zonecode, address: data.address })) }).open();
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.receiver.trim() || !form.address.trim()) return;
    setSaving(true);
    try {
      const params = { ...form, phone: form.phone || undefined, zipcode: form.zipcode || undefined, detailAddress: form.detailAddress || undefined };
      if (editingId) await updateAddress(editingId, params);
      else await addAddress(params);
      await reload();
      setModalOpen(false);
    } catch {
      window.alert("배송지를 저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (address: UserAddressResponse) => {
    if (!window.confirm(`${address.receiver} 배송지를 삭제할까요?`)) return;
    try {
      await deleteAddress(address.addressId);
      await reload();
    } catch {
      window.alert("배송지를 삭제하지 못했어요.");
    }
  };
  const makeDefault = async (addressId: number) => {
    try {
      await setDefaultAddress(addressId);
      await reload();
    } catch {
      window.alert("기본 배송지를 변경하지 못했어요.");
    }
  };

  return (
    <main className={styles.page}>
      <header><div><h1>배송지 관리</h1><p>자주 사용하는 배송지를 등록하고 기본 배송지를 지정할 수 있어요.</p></div><button type="button" onClick={openAdd}><Plus size={18} />새 배송지 추가</button></header>
      {loading ? <div className={styles.empty}>배송지를 불러오는 중이에요.</div> : addresses.length === 0 ? <div className={styles.empty}><MapPin size={38} /><strong>등록된 배송지가 없어요.</strong><button type="button" onClick={openAdd}>첫 배송지 등록하기</button></div> : (
        <div className={styles.grid}>{addresses.map((address) => <article key={address.addressId} className={address.isDefault ? styles.defaultCard : ""}><header><strong>{address.receiver}</strong>{address.isDefault && <span>기본 배송지</span>}</header>{address.phone && <p>{address.phone}</p>}<p>[{address.zipcode ?? "우편번호 없음"}] {address.address} {address.detailAddress}</p><footer><button type="button" onClick={() => openEdit(address)}>수정</button><button type="button" onClick={() => remove(address)}><Trash2 size={15} />삭제</button>{!address.isDefault && <button type="button" className={styles.defaultButton} onClick={() => makeDefault(address.addressId)}>기본 배송지로 설정</button>}</footer></article>)}</div>
      )}
      {modalOpen && <div className={styles.overlay} onClick={() => setModalOpen(false)}><section className={styles.modal} onClick={(event) => event.stopPropagation()}><header><h2>{editingId ? "배송지 수정" : "새 배송지 추가"}</h2><button type="button" onClick={() => setModalOpen(false)}>닫기</button></header><form onSubmit={save}><label>수령인<input required value={form.receiver} onChange={(event) => setForm({ ...form, receiver: event.target.value })} /></label><label>연락처<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="010-0000-0000" /></label><label>우편번호<div><input readOnly value={form.zipcode} /><button type="button" onClick={searchAddress}>주소 검색</button></div></label><label>주소<input required readOnly value={form.address} onClick={searchAddress} /></label><label>상세 주소<input value={form.detailAddress} onChange={(event) => setForm({ ...form, detailAddress: event.target.value })} /></label><label className={styles.checkbox}><input type="checkbox" checked={form.isDefault} disabled={Boolean(editingId && form.isDefault)} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />기본 배송지로 지정</label><button type="submit" className={styles.submit} disabled={saving}>{saving ? "저장 중..." : "저장하기"}</button></form></section></div>}
    </main>
  );
}
