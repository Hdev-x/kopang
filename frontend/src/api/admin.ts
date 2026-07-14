import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type AdminMemberResponse = {
    userId: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    membershipType: "일반" | "멤버십";
    riskLevel: "고위험" | "중위험" | "저위험";
    churnProbability: number;
};

export type AtRiskMember = {
    name: string;
    ends: string;
    score: number;
    reason: string;
    action: string;
    status: "발송됨" | "예정" | "대조군";
};

export type AdminMembershipStatsResponse = {
    membershipCount: number;
    newSubscribersThisMonth: number;
    atRiskCount: number;
    retentionRate: number;
    atRiskMembers: AtRiskMember[];
};

export type AdminCouponResponse = {
    couponId: number;
    name: string;
    discountType: "RATE" | "AMOUNT";
    discountValue: number;
    endDate: string;
    quantity: number;
    issuedCount: number;
    usedCount: number;
    targetGroup: string;
};

// 1. 관리자 회원 목록 조회
export async function getAdminMembers() {
    const res = await client.get<ApiResponse<AdminMemberResponse[]>>("/admin/members");
    return res.data.data;
}

// 2. 관리자 멤버십 지표 및 해지 위험 회원 조회
export async function getAdminMembershipStats() {
    const res = await client.get<ApiResponse<AdminMembershipStatsResponse>>("/admin/membership/stats");
    return res.data.data;
}

// 3. 관리자 쿠폰 발행 현황 조회
export async function getAdminCoupons() {
    const res = await client.get<ApiResponse<AdminCouponResponse[]>>("/admin/coupons");
    return res.data.data;
}

// 4. 관리자 쿠폰 신규 발행 (이벤트 등록)
export async function createAdminCoupon(params: {
    name: string;
    discountType: "RATE" | "AMOUNT";
    discountValue: number;
    startDate?: string;
    endDate?: string;
    quantity: number;
}) {
    const res = await client.post<ApiResponse<{ message: string }>>("/admin/coupons/create", params);
    return res.data.data;
}
