import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Skeleton, SkeletonRows } from "../../../components/Skeleton";
import { getAdminQnaList } from "../../../api/qna";
import type { QnaSummary } from "../../../types/qna";
import styles from "./AdminSupport.module.css";

type Filter = "전체" | "답변대기" | "답변완료";
const FILTERS: Filter[] = ["전체", "답변대기", "답변완료"];

export function AdminInquiriesPage() {
    // null = 아직 로딩 중. 빈 배열(=문의 없음)과 구분해야 스켈레톤과 빈 화면을 나눠 보여줄 수 있다.
    const [inquiries, setInquiries] = useState<QnaSummary[] | null>(null);
    const [filter, setFilter] = useState<Filter>("전체");
    const [keyword, setKeyword] = useState("");

    useEffect(() => {
        let cancelled = false;
        getAdminQnaList()
            .then((data) => { if (!cancelled) setInquiries(data); })
            .catch((e) => { console.error("문의 목록 조회 실패", e); if (!cancelled) setInquiries([]); });
        return () => { cancelled = true; };
    }, []);

    const loading = inquiries === null;
    const waiting = inquiries?.filter((q) => q.status === "답변대기").length ?? 0;

    const shown = useMemo(() => {
        if (!inquiries) return [];
        const kw = keyword.trim();
        return inquiries.filter(
            (q) => (filter === "전체" || q.status === filter) && (!kw || q.title.includes(kw) || q.author.includes(kw)),
        );
    }, [inquiries, filter, keyword]);

    return (
        <AdminLayout title="문의 관리" fullBleed>
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <p className={styles.caption}>
                        {/* 로딩 중에도 문장 틀은 남기고 숫자 자리만 자리표시자로 둔다 */}
                        전체 {loading || !inquiries
                            ? <Skeleton w={22} h={12} style={{ display: "inline-block", verticalAlign: "-1px" }} />
                            : inquiries.length.toLocaleString()}건
                        {" · 답변대기 "}
                        {loading || !inquiries
                            ? <Skeleton w={16} h={12} style={{ display: "inline-block", verticalAlign: "-1px" }} />
                            : waiting.toLocaleString()}건
                    </p>
                    <span className={styles.spacer} />
                    <div className={styles.filters}>
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                type="button"
                                className={`${styles.chip} ${filter === f ? styles.chipActive : ""}`}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <input
                        className={styles.search}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="제목·작성자 검색"
                    />
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.tbl}>
                        <thead>
                            <tr>
                                <th style={{ width: 78 }}>번호</th>
                                <th style={{ width: 96 }}>유형</th>
                                <th>제목</th>
                                <th style={{ width: 130 }}>작성자</th>
                                <th style={{ width: 120 }}>작성일</th>
                                <th style={{ width: 108 }}>상태</th>
                                <th style={{ width: 56 }} />
                            </tr>
                        </thead>
                        <tbody>
                            {loading || inquiries === null ? (
                                <SkeletonRows rows={10} cols={7} widths={["40%", "60%", "72%", "56%", "70%", "58%", "30%"]} />
                            ) : shown.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className={styles.empty}>
                                        {inquiries.length === 0 ? "등록된 문의가 없습니다." : "조건에 맞는 문의가 없습니다."}
                                    </td>
                                </tr>
                            ) : (
                                shown.map((q) => (
                                    <tr key={q.id}>
                                        <td className={styles.num}>{q.id}</td>
                                        <td>
                                            <span className={`${styles.badge} ${q.type === "PRODUCT" ? styles.bInfo : styles.bMuted}`}>
                                                {q.type === "PRODUCT" ? "상품문의" : "일반문의"}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/admin/inquiries/${q.id}`} className={styles.rowLink}>
                                                <span className={styles.ellip}>{q.title}</span>
                                            </Link>
                                        </td>
                                        <td>{q.author}</td>
                                        <td className={styles.num}>{q.createdAt?.slice(0, 10)}</td>
                                        <td>
                                            <span className={`${styles.badge} ${q.status === "답변완료" ? styles.bDone : styles.bWait}`}>
                                                {q.status}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/admin/inquiries/${q.id}`} className={styles.backLink} aria-label="상세 보기">
                                                <ChevronRight size={15} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
