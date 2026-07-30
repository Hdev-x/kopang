import { useEffect, useState } from "react";
import { ChevronUp, Clock3, MessageCircle, ShoppingCart, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getCart } from "../../api/cart";
import { useAuth } from "../../hooks/useAuth";
import type { CartItem } from "../../types/cart";
import type { Product } from "../../types/product";
import styles from "./WebQuickBar.module.css";

type Panel = "cart" | "recent" | "help";

const PANEL_TITLE: Record<Panel, string> = {
  cart: "장바구니",
  recent: "최근 본 상품",
  help: "도움말",
};

function readRecentProducts(): Product[] {
  try {
    const value = localStorage.getItem("kopang_recent_products");
    return value ? (JSON.parse(value) as Product[]) : [];
  } catch {
    return [];
  }
}

export function WebQuickBar() {
  const user = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[] | null>(null);
  const recentProducts = panel === "recent" ? readRecentProducts() : [];

  useEffect(() => {
    const trigger = document.querySelector<HTMLButtonElement>("[data-quickbar-cart-trigger]");
    const openCart = () => setPanel("cart");
    trigger?.addEventListener("click", openCart);
    return () => trigger?.removeEventListener("click", openCart);
  }, []);

  useEffect(() => {
    if (panel !== "cart" || !user) return;

    getCart()
      .then(setCartItems)
      .catch(() => setCartItems([]));
  }, [panel, user]);

  useEffect(() => {
    if (!panel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [panel]);

  return (
    <>
      <aside className={styles.quickBar} aria-label="웹 빠른 메뉴">
        <button type="button" onClick={() => setPanel("cart")} aria-label="장바구니 열기">
          <ShoppingCart size={21} />
        </button>
        <button type="button" onClick={() => setPanel("recent")} aria-label="최근 본 상품 열기">
          <Clock3 size={21} />
        </button>
        <button type="button" onClick={() => setPanel("help")} aria-label="도움말 열기">
          <MessageCircle size={21} />
        </button>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="맨 위로">
          <ChevronUp size={21} />
        </button>
      </aside>

      {panel && (
        <div className={styles.overlay} role="presentation" onMouseDown={() => setPanel(null)}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.modalHeader}>
              <h2 id="quick-modal-title">{PANEL_TITLE[panel]}</h2>
              <button type="button" onClick={() => setPanel(null)} aria-label="닫기">
                <X size={22} />
              </button>
            </header>
            <div className={styles.modalBody}>
              {panel === "cart" && (
                !user ? (
                  <EmptyState message="로그인하면 장바구니를 확인할 수 있어요." action="로그인" to="/web/login" />
                ) : cartItems === null ? (
                  <p className={styles.status}>장바구니를 불러오는 중이에요.</p>
                ) : cartItems.length === 0 ? (
                  <EmptyState message="장바구니에 담긴 상품이 없어요." action="상품 보러 가기" to="/web/products" />
                ) : (
                  <div>
                    <ul className={styles.itemList}>
                      {cartItems.map((item) => (
                        <li key={item.itemId}>
                          <Link to={`/web/products/${item.productId}`} onClick={() => setPanel(null)}>
                            <img src={item.imageUrl} alt="" />
                            <span><b>{item.name}</b><small>{item.quantity}개 · {(item.price * item.quantity).toLocaleString()}원</small></span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        type="button"
                        style={{
                          width: "100%",
                          padding: "12px",
                          backgroundColor: "var(--color-primary, #007bff)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: 600,
                          fontSize: "14px",
                          cursor: "pointer"
                        }}
                        onClick={() => {
                          setPanel(null);
                          navigate("/web/checkout", { state: { selectedItems: cartItems } });
                        }}
                      >
                        상품 주문하기 ({cartItems.reduce((acc, i) => acc + i.quantity, 0)}개)
                      </button>
                      <Link
                        to="/web/cart"
                        style={{
                          display: "block",
                          textAlign: "center",
                          padding: "8px",
                          color: "var(--color-text-muted, #666)",
                          fontSize: "13px",
                          textDecoration: "underline"
                        }}
                        onClick={() => setPanel(null)}
                      >
                        장바구니 전체보기
                      </Link>
                    </div>
                  </div>
                )
              )}

              {panel === "recent" && (
                recentProducts.length === 0 ? (
                  <EmptyState message="최근 본 상품이 아직 없어요." action="상품 보러 가기" to="/web/products" />
                ) : (
                  <ul className={styles.itemList}>
                    {recentProducts.map((product) => (
                      <li key={product.id}>
                        <Link to={`/web/products/${product.id}`} onClick={() => setPanel(null)}>
                          <img src={product.imageUrl} alt="" />
                          <span><b>{product.name}</b><small>{product.price.toLocaleString()}원</small></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {panel === "help" && (
                <div className={styles.help}>
                  <p>궁금한 내용을 빠르게 확인하세요.</p>
                  <Link to="/web/support" onClick={() => setPanel(null)}>고객센터로 이동</Link>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function EmptyState({ message, action, to }: { message: string; action: string; to: string }) {
  return (
    <div className={styles.empty}>
      <p>{message}</p>
      <Link to={to}>{action}</Link>
    </div>
  );
}
