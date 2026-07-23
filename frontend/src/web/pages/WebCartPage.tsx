import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { deleteCartItem, getCart, updateCartItem } from "../../api/cart";
import type { CartItem } from "../../types/cart";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebCommercePages.module.css";

export function WebCartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCart().then((data) => {
      setItems(data);
      setSelected(new Set(data.map((item) => item.itemId)));
    }).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const selectedItems = useMemo(() => items.filter((item) => selected.has(item.itemId)), [items, selected]);
  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const toggle = (itemId: number) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
    return next;
  });

  const changeQuantity = (item: CartItem, quantity: number) => {
    if (quantity < 1) return;
    updateCartItem(item.itemId, quantity).then(() => {
      setItems((current) => current.map((value) => value.itemId === item.itemId ? { ...value, quantity } : value));
    }).catch(() => window.alert("수량을 변경하지 못했어요."));
  };

  const remove = (itemId: number) => {
    deleteCartItem(itemId).then(() => {
      setItems((current) => current.filter((item) => item.itemId !== itemId));
      setSelected((current) => { const next = new Set(current); next.delete(itemId); return next; });
    }).catch(() => window.alert("상품을 삭제하지 못했어요."));
  };

  return (
    <WebLayout>
      <header className={styles.pageTitle}><p>SHOPPING CART</p><h1>장바구니</h1></header>
      {loading ? <div className={styles.status}>장바구니를 불러오는 중이에요.</div> : items.length === 0 ? (
        <div className={styles.empty}><ShoppingBag size={42} /><h2>장바구니가 비어 있어요.</h2><Link to="/web/products">상품 둘러보기</Link></div>
      ) : (
        <div className={styles.commerceLayout}>
          <section className={styles.cartList}>
            <div className={styles.selectAll}>
              <label><input type="checkbox" checked={selected.size === items.length} onChange={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map((item) => item.itemId)))} /> 전체 선택 ({selected.size}/{items.length})</label>
            </div>
            {items.map((item) => (
              <article key={item.itemId} className={styles.cartItem}>
                <input type="checkbox" checked={selected.has(item.itemId)} onChange={() => toggle(item.itemId)} aria-label={`${item.name} 선택`} />
                <Link to={`/web/products/${item.productId}`}><img src={item.imageUrl} alt="" /></Link>
                <div className={styles.itemInfo}>
                  <Link to={`/web/products/${item.productId}`}>{item.name}</Link>
                  <span>무료배송</span>
                  {item.originalPrice && item.originalPrice > item.price ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#e53e3e', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                      </span>
                      <strong style={{ whiteSpace: 'nowrap' }}>{item.price.toLocaleString()}원</strong>
                      <span style={{ color: '#9ca3af', fontSize: '12px', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
                        {item.originalPrice.toLocaleString()}원
                      </span>
                    </div>
                  ) : (
                    <strong style={{ whiteSpace: 'nowrap' }}>{item.price.toLocaleString()}원</strong>
                  )}
                </div>
                <div className={styles.itemActions}>
                  <button type="button" onClick={() => remove(item.itemId)} aria-label="삭제"><Trash2 size={18} /></button>
                  <div><button type="button" onClick={() => changeQuantity(item, item.quantity - 1)}><Minus size={15} /></button><span>{item.quantity}</span><button type="button" onClick={() => changeQuantity(item, item.quantity + 1)}><Plus size={15} /></button></div>
                </div>
              </article>
            ))}
          </section>
          <aside className={styles.orderSummary}>
            <h2>결제 예정 금액</h2><dl><dt>상품금액</dt><dd>{total.toLocaleString()}원</dd><dt>배송비</dt><dd>무료</dd></dl>
            <div><span>총 결제금액</span><strong>{total.toLocaleString()}원</strong></div>
            <button type="button" disabled={selectedItems.length === 0} onClick={() => navigate("/web/checkout", { state: { selectedItems } })}>{selectedItems.length}개 상품 주문하기</button>
          </aside>
        </div>
      )}
    </WebLayout>
  );
}
