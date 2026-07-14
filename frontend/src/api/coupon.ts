import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type CouponResponse = {
    couponId: number;
    name: string;
    discountType: "RATE" | "AMOUNT";
    discountValue: number;
    startDate: string;
    endDate: string;
    quantity: number;
};

export type UserCouponResponse = {
    userCouponId: number;
    userId: number;
    couponId: number;
    used: boolean;
    issuedAt: string;
    expiresAt: string;
    usedAt: string | null;
    name: string;
    discountType: "RATE" | "AMOUNT";
    discountValue: number;
};

// 1. 다운로드 가능한 전체 쿠폰 목록 조회
export async function getAvailableCoupons() {
    const res = await client.get<ApiResponse<CouponResponse[]>>("/coupons/available");
    return res.data.data;
}

// 2. 내가 보유한 쿠폰 목록 조회
export async function getMyCoupons() {
    const res = await client.get<ApiResponse<UserCouponResponse[]>>("/coupons/my");
    return res.data.data;
}

// 3. 쿠폰 다운로드 (발급 신청)
export async function downloadCoupon(couponId: number) {
    const res = await client.post<ApiResponse<UserCouponResponse>>("/coupons/issue", { couponId });
    return res.data.data;
}

// 4. 쿠폰 사용 처리
export async function useCoupon(userCouponId: number) {
    const res = await client.post<ApiResponse<{ message: string }>>("/coupons/use", { userCouponId });
    return res.data.data;
}
