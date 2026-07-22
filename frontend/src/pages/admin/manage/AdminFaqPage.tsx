import { useEffect, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Button } from "../../../components/Button";
import {
    createFaq,
    deleteFaq,
    getFaqList,
    updateFaq,
} from "../../../api/faq";
import type { Faq, FaqRequest } from "../../../types/faq";

export function AdminFaqPage() {
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [category, setCategory] = useState("GENERAL");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const loadFaqs = async () => {
        try {
            const data = await getFaqList();
            setFaqs(data);
        } catch (error) {
            console.error("FAQ 목록 조회 실패", error);
            alert("FAQ 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        getFaqList()
            .then((data) => {
                if (!cancelled) {
                    setFaqs(data);
                }
            })
            .catch((error) => {
                console.error("FAQ 목록 조회 실패", error);
                alert("FAQ 목록을 불러오지 못했습니다.");
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
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

        const request: FaqRequest = {
            question,
            answer,
            category,
        };

        try {
            if (editingId === null) {
                await createFaq(request);
                alert("FAQ가 등록되었습니다.");
            } else {
                await updateFaq(editingId, request);
                alert("FAQ가 수정되었습니다.");
            }

            resetForm();
            await loadFaqs();
        } catch (error) {
            console.error("FAQ 저장 실패", error);
            alert("FAQ 저장에 실패했습니다.");
        }
    };

    const handleEdit = (faq: Faq) => {
        setEditingId(faq.id);
        setQuestion(faq.question);
        setAnswer(faq.answer);
        setCategory(faq.category);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("이 FAQ를 삭제하시겠습니까?")) {
            return;
        }

        try {
            await deleteFaq(id);
            alert("FAQ가 삭제되었습니다.");

            if (editingId === id) {
                resetForm();
            }

            await loadFaqs();
        } catch (error) {
            console.error("FAQ 삭제 실패", error);
            alert("FAQ 삭제에 실패했습니다.");
        }
    };

    if (loading) {
        return (
            <AdminLayout title="FAQ 관리">
                <p>FAQ 목록을 불러오는 중입니다.</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="FAQ 관리">
            <div style={{ display: "grid", gap: "24px" }}>
                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "grid",
                        gap: "16px",
                        padding: "20px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: "18px" }}>
                        {editingId === null ? "FAQ 등록" : "FAQ 수정"}
                    </h2>

                    <label>
                        카테고리
                        <input
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            placeholder="예: GENERAL, DELIVERY"
                        />
                    </label>

                    <label>
                        질문
                        <input
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            placeholder="자주 묻는 질문을 입력하세요."
                        />
                    </label>

                    <label>
                        답변
                        <textarea
                            value={answer}
                            onChange={(event) => setAnswer(event.target.value)}
                            placeholder="질문에 대한 답변을 입력하세요."
                            rows={5}
                        />
                    </label>

                    <div style={{ display: "flex", gap: "8px" }}>
                        <Button type="submit">
                            {editingId === null ? "등록" : "수정 완료"}
                        </Button>

                        {editingId !== null && (
                            <Button type="button" variant="ghost" onClick={resetForm}>
                                수정 취소
                            </Button>
                        )}
                    </div>
                </form>

                <section style={{ display: "grid", gap: "12px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px" }}>등록된 FAQ</h2>

                    {faqs.length === 0 ? (
                        <p>등록된 FAQ가 없습니다.</p>
                    ) : (
                        faqs.map((faq) => (
                            <article
                                key={faq.id}
                                style={{
                                    padding: "20px",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    backgroundColor: "#fff",
                                }}
                            >
                                <small>{faq.category}</small>
                                <h3>Q. {faq.question}</h3>
                                <p>{faq.answer}</p>

                                <div style={{ display: "flex", gap: "8px" }}>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(faq)}
                                    >
                                        수정
                                    </Button>

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(faq.id)}
                                    >
                                        삭제
                                    </Button>
                                </div>
                            </article>
                        ))
                    )}
                </section>

            </div>
        </AdminLayout>
    );
}