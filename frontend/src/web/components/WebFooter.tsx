import { Link, useLocation } from "react-router-dom";
import { ChevronRight, MessageCircle, Phone } from "lucide-react";
import { toMobilePath } from "../../routes/platformPath";
import styles from "./WebFooter.module.css";

export function WebFooter() {
  const location = useLocation();
  return <footer className={styles.footer}><div className={styles.inner}>
    <section className={styles.support}><h2>고객센터 <ChevronRight size={18} /></h2><Link to="/web/support/inquiry"><span><strong>1:1 문의</strong><small>문의 내용을 남겨주시면 확인 후 답변드려요.</small></span><ChevronRight size={18} /></Link><button type="button" onClick={() => window.dispatchEvent(new Event("open-web-chatbot"))}><MessageCircle size={20} /><span><strong>채팅 상담</strong><small>AI 상담봇에게 바로 물어보세요.</small></span><ChevronRight size={18} /></button><div className={styles.phone}><Phone size={20} /><span><strong>고객 상담 안내</strong><small>평일 09:00–18:00 · 주말 및 공휴일 휴무</small></span></div></section>
    <nav aria-label="Footer 안내 메뉴"><div><Link to="/web/support">회사소개</Link><Link to="/web/support/notices">공지사항</Link><Link to="/web/support/faq">이용약관</Link><Link to="/web/support">권리보호센터</Link></div><div><Link to="/web/support/inquiry">입점·제휴 문의</Link><Link to="/web/support/faq"><strong>개인정보 처리방침</strong></Link><Link to="/web/membership">멤버십 안내</Link><Link to={toMobilePath(location.pathname, location.search)}>모바일 화면</Link></div></nav>
    <section className={styles.company}><Link to="/web" className={styles.logo}>Kopang</Link><p>Kopang 팀 프로젝트 · 대한민국</p><p>상품과 혜택 및 사업자 정보는 포트폴리오 시연을 위한 예시입니다.</p><p>실제 통신판매 또는 결제 서비스를 제공하지 않습니다.</p></section>
  </div><div className={styles.legal}><span>© 2026 Kopang Team Project. All rights reserved.</span><span>더 편리한 쇼핑 경험을 만드는 팀 프로젝트 서비스입니다.</span></div></footer>;
}
