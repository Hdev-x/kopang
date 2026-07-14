import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type PointHistoryResponse = {
    pointId: number;
    userId: number;
    amount: number;
    type: "SAVED" | "USED" | "EVENT" | "REVIEW";
    description: string;
    createdAt: string;
};

// 1. 포인트 잔액 조회
export async function getPointBalance() {
    const res = await client.get<ApiResponse<{ balance: number }>>("/points/balance");
    return res.data.data;
}

// 2. 포인트 변동 내역 조회
export async function getPointHistory() {
    const res = await client.get<ApiResponse<PointHistoryResponse[]>>("/points/history");
    return res.data.data;
}

// 3. 모의 적립 (테스트용)
export async function earnPoint(amount: number, description?: string) {
    const res = await client.post<ApiResponse<{ message: string }>>("/points/earn", {
        amount,
        type: "EVENT",
        description
    });
    return res.data.data;
}

// 4. 포인트 모의 사용 (테스트용)
export async function spendPoint(amount: number, description?: string) {
    const res = await client.post<ApiResponse<{ message: string }>>("/points/use", {
        amount,
        description
    });
    return res.data.data;
}
