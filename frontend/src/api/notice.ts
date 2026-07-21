import { client } from "./client";
import type { ApiResponse } from "../types/api";
import type { Notice } from "../types/notice";

export async function getNoticeList() {
    const response =
        await client.get<ApiResponse<Notice[]>>("/notices");

    return response.data.data;
}

export async function getNotice(id: number) {
    const response =
        await client.get<ApiResponse<Notice>>(`/notices/${id}`);

    return response.data.data;
}