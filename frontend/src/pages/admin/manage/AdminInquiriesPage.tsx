import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../../components/AdminLayout";
import { getAdminQnaList } from "../../../api/qna";
import type { QnaSummary } from "../../../types/qna";

export function AdminInquiriesPage() {
    const [inquiries, setInquiries] = useState<QnaSummary[]>([]);

    useEffect(() => {
        getAdminQnaList()
            .then(setInquiries)
            .catch(console.error);
    }, []);
    return (
        <AdminLayout title="문의관리">
            <p>전체 문의 {inquiries.length}건</p>
            <ul>
                {inquiries.map((inquiry) => (
                    <li key={inquiry.id}>
                        <Link to={`/admin/inquiries/${inquiry.id}`}>
                            <span>
                                {inquiry.type === "PRODUCT" ? "상품문의" : "일반문의"}
                            </span>
                            <strong>{inquiry.title}</strong>
                            <span>{inquiry.status}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </AdminLayout>
    );
}