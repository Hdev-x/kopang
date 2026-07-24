import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AdminLayout } from "../../../components/AdminLayout";
import type { QnaPost } from "../../../types/qna";
import { answerQna, getAdminQna } from "../../../api/qna";

export function AdminInquiryDetailPage() {

    const { id } = useParams<{ id: string }>();
    const [inquiry, setInquiry] = useState<QnaPost | null>(null);
    const [answerContent, setAnswerContent] = useState("");
    useEffect(() => {
        if (!id) return;

        getAdminQna(Number(id))
            .then(setInquiry)
            .catch(console.error);
    }, [id]);

    const handleAnswerSubmit = async () => {
        if (!id || !answerContent.trim()) return;

        await answerQna(Number(id), answerContent);

        const updatedInquiry = await getAdminQna(Number(id));
        setInquiry(updatedInquiry);
        setAnswerContent("");
    };
    if (!inquiry) {
        return (
            <AdminLayout title="문의 상세">
                <p>문의 정보를 불러오는 중입니다.</p>
            </AdminLayout>
        );
    }
    return (
        <AdminLayout title="문의 상세">
            <div>
                <p>{inquiry.type === "PRODUCT" ? "상품문의" : "일반문의"}</p>
                <h2>{inquiry.title}</h2>
                <p>{inquiry.content}</p>
                <p>작성자: {inquiry.author}</p>
                <p>상태: {inquiry.status}</p>
                <p>작성일: {inquiry.createdAt}</p>
            </div>
            <div>
                <h3>답변 작성</h3>
                <textarea
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    placeholder="고객에게 전달할 답변을 입력하세요."
                />
                <button type="button" onClick={handleAnswerSubmit}>
                    답변 등록
                </button>
            </div>
        </AdminLayout>
    );
}