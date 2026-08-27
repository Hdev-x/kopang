import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, CircleHelp, Headphones, Megaphone, MessageSquare, Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getFaqList } from "../../api/faq";
import { getNotice, getNoticeList } from "../../api/notice";
import { getQna, getQnaList } from "../../api/qna";
import type { Faq } from "../../types/faq";
import type { Notice } from "../../types/notice";
import type { QnaPost, QnaSummary } from "../../types/qna";
import { WebLayout } from "../components/WebLayout";
import styles from "./WebServicePages.module.css";

// 알림·문의 작성은 전용 화면이 따로 있어 여기서는 재노출만 한다 (AppRouter import 경로 유지).
export { WebNotificationsPage } from "./WebNotificationsPage";
export { WebInquiryWritePage as WebSupportInquiryPage } from "./WebInquiryWritePage";
export { WebInquiryWritePage as WebQnaWritePage } from "./WebInquiryWritePage";

export function WebSupportPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  useEffect(() => { Promise.all([getFaqList().catch(() => []), getNoticeList().catch(() => [])]).then(([faqData, noticeData]) => { setFaqs(faqData); setNotices(noticeData); }); }, []);
  return <WebLayout><ServiceHeading eyebrow="CUSTOMER CENTER" title="무엇을 도와드릴까요?" description="자주 묻는 질문을 확인하거나 고객센터에 직접 문의할 수 있어요." /><section className={styles.supportCards}><Link to="/web/support/faq"><CircleHelp /><strong>자주 묻는 질문</strong><span>빠르게 답을 찾아보세요.</span><ChevronRight /></Link><Link to="/web/support/notices"><Megaphone /><strong>공지사항</strong><span>서비스 소식을 확인하세요.</span><ChevronRight /></Link><Link to="/web/support/inquiry"><Headphones /><strong>1:1 문의</strong><span>상담이 필요한 내용을 남겨주세요.</span><ChevronRight /></Link></section><div className={styles.supportColumns}><section><header><h2>자주 찾는 질문</h2><Link to="/web/support/faq">전체보기</Link></header>{faqs.slice(0, 5).map((faq) => <Link key={faq.id} to="/web/support/faq">{faq.question}<ChevronRight /></Link>)}</section><section><header><h2>최근 공지</h2><Link to="/web/support/notices">전체보기</Link></header>{notices.slice(0, 5).map((notice) => <Link key={notice.id} to={`/web/support/notices/${notice.id}`}>{notice.title}<time>{formatDate(notice.createdAt)}</time></Link>)}</section></div></WebLayout>;
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

function ServiceHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className={styles.heading}><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{action}</header>;
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className={styles.search}><Search /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function ServiceEmpty({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return <div className={styles.empty}>{icon}<strong>{label}</strong></div>;
}

function formatDate(value: string) { return new Date(value).toLocaleDateString("ko-KR"); }
