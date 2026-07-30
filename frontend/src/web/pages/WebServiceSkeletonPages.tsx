import { useEffect, useState, type FormEvent } from "react";
import { Bell, ChevronDown, ChevronRight, CircleHelp, Headphones, Megaphone, MessageSquare, Search, Send } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getFaqList } from "../../api/faq";
import { getNotice, getNoticeList } from "../../api/notice";
import { getNotifications, markNotificationClicked, type NotificationItem } from "../../api/notifications";
import { createQna, getQna, getQnaList } from "../../api/qna";
import type { Faq } from "../../types/faq";
import type { Notice } from "../../types/notice";
import type { QnaPost, QnaSummary } from "../../types/qna";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebServicePages.module.css";

export function WebNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  useEffect(() => { getNotifications().then(setItems).catch(() => setItems([])).finally(() => setLoading(false)); }, []);
  const filtered = filter === "ALL" ? items : items.filter((item) => notificationGroup(item.type) === filter);
  const openNotification = (item: NotificationItem) => {
    if (!item.read) {
      setItems((current) => current.map((value) => value.id === item.id ? { ...value, read: true } : value));
      markNotificationClicked(item.id).catch(() => undefined);
    }
  };
  return <WebLayout><ServiceHeading eyebrow="NOTIFICATIONS" title="알림" description="주문과 혜택에 관한 새로운 소식을 확인하세요." /><div className={styles.filters}>{[["ALL", "전체"], ["SHOPPING", "쇼핑"], ["BENEFIT", "혜택"], ["SERVICE", "서비스"]].map(([value, label]) => <button type="button" key={value} className={filter === value ? styles.activeFilter : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>{loading ? <ServiceEmpty label="알림을 불러오는 중이에요." /> : filtered.length === 0 ? <ServiceEmpty icon={<Bell />} label="받은 알림이 없어요." /> : <div className={styles.notificationList}>{filtered.map((item) => { const to = notificationLink(item); const content = <><span className={styles.notificationIcon}>{notificationEmoji(item.type)}</span><div><strong>{notificationLabel(item.type)}</strong><p>{item.message}</p><time>{timeAgo(item.createdAt)}</time></div>{!item.read && <i />}</>; return to ? <Link key={item.id} to={to} className={!item.read ? styles.unread : ""} onClick={() => openNotification(item)}>{content}</Link> : <button type="button" key={item.id} className={!item.read ? styles.unread : ""} onClick={() => openNotification(item)}>{content}</button>; })}</div>}</WebLayout>;
}

export function WebSupportPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  useEffect(() => { Promise.all([getFaqList().catch(() => []), getNoticeList().catch(() => [])]).then(([faqData, noticeData]) => { setFaqs(faqData); setNotices(noticeData); }); }, []);
  return <WebLayout><ServiceHeading eyebrow="CUSTOMER CENTER" title="무엇을 도와드릴까요?" description="자주 묻는 질문을 확인하거나 고객센터에 직접 문의할 수 있어요." /><section className={styles.supportCards}><Link to="/web/support/faq"><CircleHelp /><strong>자주 묻는 질문</strong><span>빠르게 답을 찾아보세요.</span><ChevronRight /></Link><Link to="/web/support/notices"><Megaphone /><strong>공지사항</strong><span>서비스 소식을 확인하세요.</span><ChevronRight /></Link><Link to="/web/support/inquiry"><Headphones /><strong>1:1 문의</strong><span>상담이 필요한 내용을 남겨주세요.</span><ChevronRight /></Link></section><div className={styles.supportColumns}><section><header><h2>자주 찾는 질문</h2><Link to="/web/support/faq">전체보기</Link></header>{faqs.slice(0, 5).map((faq) => <Link key={faq.id} to="/web/support/faq">{faq.question}<ChevronRight /></Link>)}</section><section><header><h2>최근 공지</h2><Link to="/web/support/notices">전체보기</Link></header>{notices.slice(0, 5).map((notice) => <Link key={notice.id} to={`/web/support/notices/${notice.id}`}>{notice.title}<time>{formatDate(notice.createdAt)}</time></Link>)}</section></div></WebLayout>;
}

export function WebSupportInquiryPage() {
  return <WebLayout><ServiceHeading eyebrow="CUSTOMER CENTER" title="1:1 문의" description="상담이 필요한 내용을 자세히 남겨주세요." /><InquiryForm type="GENERAL" /></WebLayout>;
}

export function WebNoticeListPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { getNoticeList().then(setNotices).catch(() => setNotices([])).finally(() => setLoading(false)); }, []);
  const filtered = notices.filter((notice) => notice.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <WebLayout><ServiceHeading eyebrow="NOTICE" title="공지사항" description="Kopang의 새로운 소식과 서비스 안내를 확인하세요." /><SearchField value={query} onChange={setQuery} placeholder="공지 제목 검색" />{loading ? <ServiceEmpty label="공지를 불러오는 중이에요." /> : filtered.length === 0 ? <ServiceEmpty icon={<Megaphone />} label="표시할 공지가 없어요." /> : <div className={styles.tableList}>{filtered.map((notice, index) => <Link key={notice.id} to={`/web/support/notices/${notice.id}`}><span>{notices.length - index}</span><strong>{notice.title}</strong><time>{formatDate(notice.createdAt)}</time><ChevronRight /></Link>)}</div>}</WebLayout>;
}

export function WebNoticeDetailPage() {
  const { id } = useParams();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const numericId = Number(id); if (!Number.isFinite(numericId)) return; getNotice(numericId).then(setNotice).catch(() => setNotice(null)).finally(() => setLoading(false)); }, [id]);
  return <WebLayout>{loading ? <ServiceEmpty label="공지를 불러오는 중이에요." /> : !notice ? <ServiceEmpty icon={<Megaphone />} label="공지 내용을 찾을 수 없어요." /> : <article className={styles.noticeDetail}><header><p>NOTICE</p><h1>{notice.title}</h1><time>{formatDate(notice.createdAt)}</time></header><div>{notice.content}</div><Link to="/web/support/notices">목록으로</Link></article>}</WebLayout>;
}

export function WebFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [openId, setOpenId] = useState<number | null>(null);
  useEffect(() => { getFaqList().then(setFaqs).catch(() => setFaqs([])); }, []);
  const categories = ["전체", ...Array.from(new Set(faqs.map((faq) => faq.category).filter(Boolean)))];
  const filtered = faqs.filter((faq) => (category === "전체" || faq.category === category) && `${faq.question} ${faq.answer}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <WebLayout><ServiceHeading eyebrow="FAQ" title="자주 묻는 질문" description="궁금한 내용을 검색하거나 카테고리별로 확인하세요." /><SearchField value={query} onChange={setQuery} placeholder="질문 검색" /><div className={styles.filters}>{categories.map((value) => <button type="button" key={value} className={category === value ? styles.activeFilter : ""} onClick={() => setCategory(value)}>{value}</button>)}</div>{filtered.length === 0 ? <ServiceEmpty icon={<CircleHelp />} label="검색 결과가 없어요." /> : <div className={styles.faqList}>{filtered.map((faq) => <article key={faq.id}><button type="button" aria-expanded={openId === faq.id} onClick={() => setOpenId((current) => current === faq.id ? null : faq.id)}><span>Q</span><strong>{faq.question}</strong><ChevronDown /></button>{openId === faq.id && <div><span>A</span><p>{faq.answer}</p></div>}</article>)}</div>}<div className={styles.helpBanner}><div><strong>원하는 답을 찾지 못했나요?</strong><span>고객센터에 문의하면 자세히 안내해 드릴게요.</span></div><Link to="/web/support/inquiry">1:1 문의하기</Link></div></WebLayout>;
}

export function WebQnaListPage() {
  const [items, setItems] = useState<QnaSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { getQnaList("PRODUCT").then(setItems).catch(() => setItems([])).finally(() => setLoading(false)); }, []);
  const filtered = items.filter((item) => item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <WebLayout><ServiceHeading eyebrow="Q&A" title="상품 문의" description="상품에 관한 문의와 답변 상태를 확인하세요." action={<Link to="/web/qna/write">문의 작성</Link>} /><SearchField value={query} onChange={setQuery} placeholder="문의 제목 검색" />{loading ? <ServiceEmpty label="상품 문의를 불러오는 중이에요." /> : filtered.length === 0 ? <ServiceEmpty icon={<MessageSquare />} label="등록된 상품 문의가 없어요." /> : <div className={styles.tableList}>{filtered.map((item) => <Link key={item.id} to={`/web/qna/${item.id}`}><span className={item.status === "답변완료" ? styles.done : styles.wait}>{item.status}</span><strong>{item.title}</strong><time>{formatDate(item.createdAt)}</time><ChevronRight /></Link>)}</div>}</WebLayout>;
}

export function WebQnaDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<QnaPost | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const numericId = Number(id); if (!Number.isFinite(numericId)) return; getQna(numericId).then(setPost).catch(() => setPost(null)).finally(() => setLoading(false)); }, [id]);
  return <WebLayout>{loading ? <ServiceEmpty label="문의를 불러오는 중이에요." /> : !post ? <ServiceEmpty icon={<MessageSquare />} label="문의 내용을 찾을 수 없어요." /> : <article className={styles.qnaDetail}><header><span className={post.status === "답변완료" ? styles.done : styles.wait}>{post.status}</span><h1>{post.title}</h1><p>{post.author} · {formatDate(post.createdAt)}</p></header><section><strong>Q</strong><p>{post.content}</p></section><section className={styles.answer}><strong>A</strong><p>{post.answerContent ?? post.answer?.content ?? "담당자가 답변을 준비하고 있어요."}</p></section><Link to="/web/qna">목록으로</Link></article>}</WebLayout>;
}

export function WebQnaWritePage() {
  const [params] = useSearchParamsSafe();
  const productId = Number(params.get("productId"));
  return <WebLayout><ServiceHeading eyebrow="Q&A" title="상품 문의 작성" description="상품에 관해 궁금한 내용을 남겨주세요." /><InquiryForm type="PRODUCT" productId={Number.isFinite(productId) ? productId : undefined} /></WebLayout>;
}

function InquiryForm({ type, productId }: { type: "PRODUCT" | "GENERAL"; productId?: number }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSubmitting(true); try { const created = await createQna(title, content, type, productId); navigate(type === "GENERAL" ? "/web/my/inquiries" : `/web/qna/${created.id}`); } catch { window.alert("문의를 등록하지 못했어요."); setSubmitting(false); } };
  return <form className={styles.inquiryForm} onSubmit={submit}><label>문의 유형<select disabled={type === "PRODUCT"}><option>{type === "PRODUCT" ? "상품 문의" : "일반 문의"}</option></select></label>{type === "PRODUCT" && <label>상품 번호<input inputMode="numeric" value={productId ?? ""} readOnly={Boolean(productId)} placeholder="상품 번호를 입력해 주세요." /></label>}<label>제목<input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="문의 제목" /></label><label>문의 내용<textarea required maxLength={2000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="문의 내용을 자세히 입력해 주세요." /><small>{content.length}/2000</small></label><div><Link to="/web/support">취소</Link><button type="submit" disabled={submitting}><Send size={17} />{submitting ? "등록 중..." : "문의 등록"}</button></div></form>;
}

function ServiceHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className={styles.heading}><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{action}</header>;
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className={styles.search}><Search /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function ServiceEmpty({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return <div className={styles.empty}>{icon}<strong>{label}</strong></div>;
}

function useSearchParamsSafe() {
  return [new URLSearchParams(window.location.search)] as const;
}

function formatDate(value: string) { return new Date(value).toLocaleDateString("ko-KR"); }
function timeAgo(value: string) { const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000); if (minutes < 1) return "방금"; if (minutes < 60) return `${minutes}분 전`; if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`; return formatDate(value); }
function notificationGroup(type: string) { return ["ABANDON", "REBUY", "WISHLIST", "RECOMMEND"].includes(type) ? "SHOPPING" : ["COUPON_EXPIRE", "WELCOME_BACK", "APOLOGY", "COMEBACK"].includes(type) ? "BENEFIT" : "SERVICE"; }
function notificationLabel(type: string) { return ({ ABANDON: "장바구니", REBUY: "재구매", WISHLIST: "찜", COUPON_EXPIRE: "쿠폰", WELCOME_BACK: "웰컴백", APOLOGY: "고객 케어", COMEBACK: "복귀 혜택", RECOMMEND: "추천", NOTICE: "공지" } as Record<string, string>)[type] ?? "서비스"; }
function notificationEmoji(type: string) { return ({ ABANDON: "🛒", REBUY: "🔁", WISHLIST: "💝", COUPON_EXPIRE: "🎟️", WELCOME_BACK: "👋", APOLOGY: "🙇", COMEBACK: "🎁", RECOMMEND: "🎯", NOTICE: "📢" } as Record<string, string>)[type] ?? "🔔"; }
function notificationLink(item: NotificationItem) { if (item.type === "RECOMMEND" && item.refId) return `/web/products/${item.refId}`; if (item.type === "ABANDON") return "/web/cart"; if (item.type === "NOTICE") return item.refId ? `/web/support/notices/${item.refId}` : "/web/support/notices"; if (["COUPON_EXPIRE", "WELCOME_BACK", "APOLOGY", "COMEBACK", "WISHLIST", "REBUY"].includes(item.type)) return "/web/my/coupons"; return null; }
