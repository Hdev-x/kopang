import { useEffect, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Skeleton, SkeletonRows } from "../../../components/Skeleton";
import { createFaq, deleteFaq, getFaqList, updateFaq } from "../../../api/faq";
import type { Faq, FaqRequest } from "../../../types/faq";
import styles from "./AdminSupport.module.css";

// 카테고리는 자유 입력이었는데, 오타 하나로 프론트 그룹핑이 깨진다.
// 실제로 쓰는 값만 목록으로 고정한다.
const CATEGORIES = [
    { value: "GENERAL", label: "일반" },
    { value: "DELIVERY", label: "배송" },
    { value: "PAYMENT", label: "결제" },
    { value: "RETURN", label: "교환·반품" },
    { value: "MEMBER", label: "회원" },
];
const categoryLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

export function AdminFaqPage() {
    const [faqs, setFaqs] = useState<Faq[] | null>(null);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [category, setCategory] = useState("GENERAL");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const loading = faqs === null;

    const loadFaqs = async () => {
        try {
            setFaqs(await getFaqList());
        } catch (error) {
            console.error("FAQ 목록 조회 실패", error);
            setFaqs([]);
        }
    };

    useEffect(() => {
        let cancelled = false;
        getFaqList()
            .then((data) => { if (!cancelled) setFaqs(data); })
            .catch((error) => {
                console.error("FAQ 목록 조회 실패", error);
                if (!cancelled) setFaqs([]);
            });
        return () => { cancelled = true; };
    }, []);

    const resetForm = () => {
        setQuestion("");
        setAnswer("");
        setCategory("GENERAL");
        setEditingId(null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!question.trim() || !answer.trim()) {
            alert("질문과 답변을 모두 입력해 주세요.");
            return;
        }

        const request: FaqRequest = { question, answer, category };
        setSaving(true);
        try {
            if (editingId === null) await createFaq(request);
            else await updateFaq(editingId, request);
            resetForm();
            await loadFaqs();
        } catch (error) {
            console.error("FAQ 저장 실패", error);
            alert("FAQ 저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (faq: Faq) => {
        setEditingId(faq.id);
        setQuestion(faq.question);
        setAnswer(faq.answer);
        setCategory(faq.category);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("이 FAQ를 삭제하시겠습니까?")) return;
        try {
            await deleteFaq(id);
            if (editingId === id) resetForm();
            await loadFaqs();
        } catch (error) {
            console.error("FAQ 삭제 실패", error);
            alert("FAQ 삭제에 실패했습니다.");
        }
    };

    return (
        <AdminLayout title="FAQ 관리" fullBleed>
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <p className={styles.caption}>
                        등록된 FAQ{" "}
                        {loading || !faqs ? <Skeleton w={22} h={12} style={{ display: "inline-block", verticalAlign: "-1px" }} /> : faqs.length.toLocaleString()}건
                        {" · 고객센터 화면에 그대로 노출됩니다"}
                    </p>
                </div>

                <div className={styles.split}>
                    {/* 왼쪽: 등록·수정 폼 (항상 같은 자리 — 수정을 눌러도 화면이 움직이지 않는다) */}
                    <div className={styles.panel}>
                        <div className={styles.panelHead}>
                            <h2>{editingId === null ? "FAQ 등록" : "FAQ 수정"}</h2>
                            {editingId !== null && <p>#{editingId}</p>}
                        </div>
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.field}>
                                <label htmlFor="faq-category">카테고리</label>
                                <select id="faq-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                                    {CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="faq-question">질문</label>
                                <input
                                    id="faq-question"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="자주 묻는 질문을 입력하세요."
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="faq-answer">답변</label>
                                <textarea
                                    id="faq-answer"
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="질문에 대한 답변을 입력하세요."
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button type="submit" className={styles.primaryBtn} disabled={saving || loading}>
                                    {saving ? "저장 중…" : editingId === null ? "등록" : "수정 완료"}
                                </button>
                                {editingId !== null && (
                                    <button type="button" className={styles.ghostBtn} onClick={resetForm}>
                                        취소
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* 오른쪽: 목록 */}
                    <div className={styles.panel}>
                        <div className={styles.panelHead}>
                            <h2>등록된 FAQ</h2>
                            <p>행을 눌러 수정합니다</p>
                        </div>
                        <div className={styles.tableWrap}>
                            <table className={styles.tbl}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 96 }}>카테고리</th>
                                        <th>질문</th>
                                        <th style={{ width: 120 }}>등록일</th>
                                        <th style={{ width: 120 }} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <SkeletonRows rows={9} cols={4} widths={["60%", "78%", "70%", "56%"]} />
                                    ) : !faqs || faqs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className={styles.empty}>등록된 FAQ가 없습니다.</td>
                                        </tr>
                                    ) : (
                                        faqs.map((faq) => (
                                            <tr key={faq.id}>
                                                <td>
                                                    <span className={`${styles.badge} ${styles.bMuted}`}>{categoryLabel(faq.category)}</span>
                                                </td>
                                                <td>
                                                    <button type="button" className={styles.rowLink} onClick={() => handleEdit(faq)}
                                                        style={{ border: 0, background: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                                                        <span className={styles.ellip}>{faq.question}</span>
                                                    </button>
                                                </td>
                                                <td className={styles.num}>{faq.createdAt?.slice(0, 10)}</td>
                                                <td>
                                                    <div className={styles.rowActions}>
                                                        <button type="button" className={`${styles.ghostBtn} ${styles.smallBtn}`} onClick={() => handleEdit(faq)}>수정</button>
                                                        <button type="button" className={`${styles.ghostBtn} ${styles.smallBtn}`} onClick={() => handleDelete(faq.id)}>삭제</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
