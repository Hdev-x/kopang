import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type UserMembershipResponse = {
    userMembershipId: number;
    userId: number;
    membershipId: number;
    startDate: string;
    endDate: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    cancelledAt: string | null;
    name: string;
    price: number;
    discountRate: number;
    description: string;
} | null;

// 1. 멤버십 구독 상태 조회
export async function getMembershipStatus() {
    const res = await client.get<ApiResponse<UserMembershipResponse>>("/membership/status");
    return res.data.data;
}

// 2. 멤버십 가입 신청 (토스 결제 검증 파라미터 포함)
export async function subscribeMembership(params: {
    paymentKey: string;
    orderId: string;
    amount: number;
}) {
    const res = await client.post<ApiResponse<UserMembershipResponse>>("/membership/subscribe", params);
    return res.data.data;
}

// 3. 멤버십 해지 예약 신청
export async function cancelMembership() {
    const res = await client.post<ApiResponse<{ message: string }>>("/membership/cancel");
    return res.data.data;
}

// 4. 멤버십 혜택 유지 (해지 예약 철회)
export async function keepMembership() {
    const res = await client.post<ApiResponse<{ message: string }>>("/membership/keep");
    return res.data.data;
}

// 5. 이번 달 아낀 배송비 조회
export async function getSavedShippingFee() {
    const res = await client.get<ApiResponse<{ savedFee: number }>>("/membership/saved-shipping");
    return res.data.data;
}
