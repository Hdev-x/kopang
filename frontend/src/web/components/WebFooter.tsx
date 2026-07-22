import { Link } from "react-router-dom";
import styles from "./WebFooter.module.css";

export function WebFooter() {
  return <footer className={styles.footer}><div className={styles.inner}>
    <section><Link to="/web" className={styles.logo}>Kopang</Link><p>더 편리한 쇼핑 경험을 만드는 팀 프로젝트 서비스입니다.</p></section>
    <nav aria-label="Footer 안내 메뉴"><div><strong>쇼핑</strong><Link to="/web/products">전체 상품</Link><Link to="/web/cart">장바구니</Link><Link to="/web/my/orders">주문 내역</Link></div><div><strong>고객지원</strong><Link to="/web/support">고객센터</Link><Link to="/web/support/faq">자주 묻는 질문</Link><Link to="/web/support/inquiry">1:1 문의</Link></div><div><strong>서비스</strong><Link to="/web/membership">멤버십</Link><Link to="/web/notifications">알림</Link><Link to="/mobile">모바일 화면</Link></div></nav>
  </div><div className={styles.legal}><span>© 2026 Kopang Team Project</span><span>화면의 상품·혜택 정보는 프로젝트 시연용입니다.</span></div></footer>;
}
