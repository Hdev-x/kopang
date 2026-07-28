import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Skeleton, SkeletonText } from "../../../components/Skeleton";
import { answerQna, getAdminQna } from "../../../api/qna";
import type { QnaPost } from "../../../types/qna";
import styles from "./AdminSupport.module.css";

export function AdminInquiryDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [inquiry, setInquiry] = useState<QnaPost | null>(null);
    const [answerContent, setAnswerContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [failed, setFailed] = useState(false);

    const loading = inquiry === null;

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        getAdminQna(Number(id))
            .then((data) => { if (!cancelled) setInquiry(data); })
            .catch((e) => { console.error("문의 조회 실패", e); setFailed(true); });
        return () => { cancelled = true; };
    }, [id]);

    const handleAnswerSubmit = async () => {
        if (!id || !answerContent.trim() || saving) return;
        setSaving(true);
        try {
            await answerQna(Number(id), answerContent);
            setInquiry(await getAdminQna(Number(id)));
            setAnswerContent("");
        } catch (e) {
            console.error("답변 등록 실패", e);
            alert("답변 등록에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const answered = inquiry?.status === "답변완료";
    const answerText = inquiry?.answer?.content ?? inquiry?.answerContent;

    return (
        <AdminLayout title="문의 상세" fullBleed>
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <Link to="/admin/inquiries" className={styles.backLink}>
                        <ChevronLeft size={15} />문의 목록
                    </Link>
                    <span className={styles.spacer} />
                    {failed && <span className={styles.caption}>문의를 불러오지 못했습니다.</span>}
                </div>

                {/* 틀은 로딩 여부와 무관하게 항상 렌더링한다 — 값 자리만 스켈레톤으로 채운다 */}
                <div className={styles.detail}>
                    <div className={styles.docWrap}>
                        <article className={styles.doc}>
                            <div className={styles.docHead}>
                                {loading ? (
                                    <Skeleton w={64} h={18} r={999} />
                                ) : (
                                    <span className={`${styles.badge} ${inquiry.type === "PRODUCT" ? styles.bInfo : styles.bMuted}`}>
                                        {inquiry.type === "PRODUCT" ? "상품문의" : "일반문의"}
                                    </span>
                                )}
                                {loading ? (
                                    <Skeleton w={64} h={18} r={999} />
                                ) : (
                                    <span className={`${styles.badge} ${answered ? styles.bDone : styles.bWait}`}>{inquiry.status}</span>
                                )}
                            </div>

                            <h2>{loading ? <Skeleton w="70%" h={22} /> : inquiry.title}</h2>

                            <div className={styles.docMeta}>
                                <span>작성자 <b>{loading ? <Skeleton w={54} h={12} style={{ display: "inline-block" }} /> : inquiry.author}</b></span>
                                <span>작성일 <b>{loading ? <Skeleton w={78} h={12} style={{ display: "inline-block" }} /> : inquiry.createdAt?.slice(0, 16).replace("T", " ")}</b></span>
                                {!loading && inquiry.productId != null && (
                                    <span>상품 <b>#{inquiry.productId}</b></span>
                                )}
                            </div>

                            <div className={styles.docBody}>
                                {loading ? <SkeletonText lines={5} /> : inquiry.content}
                            </div>

                            {!loading && answerText && (
                                <div className={styles.answered}>
                                    <div className={styles.answeredHead}>
                                        <span>등록된 답변</span>
                                        {inquiry.answer?.createdAt && <span>{inquiry.answer.createdAt.slice(0, 16).replace("T", " ")}</span>}
                                    </div>
                                    <p>{answerText}</p>
                                </div>
                            )}
                        </article>
                    </div>

                    <div className={styles.panel}>
                        <div className={styles.panelHead}>
                            <h2>{answered ? "답변 수정" : "답변 작성"}</h2>
                            <p>{answered ? "등록하면 기존 답변을 덮어씁니다" : "고객에게 바로 전달됩니다"}</p>
                        </div>
                        <div className={styles.form}>
                            <div className={styles.field}>
                                <label htmlFor="answer">답변 내용</label>
                                <textarea
                                    id="answer"
                                    value={answerContent}
                                    onChange={(e) => setAnswerContent(e.target.value)}
                                    placeholder="고객에게 전달할 답변을 입력하세요."
                                    disabled={loading}
                                />
                            </div>
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    className={styles.primaryBtn}
                                    onClick={handleAnswerSubmit}
                                    disabled={loading || saving || !answerContent.trim()}
                                >
                                    {saving ? "등록 중…" : "답변 등록"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
