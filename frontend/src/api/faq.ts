import { client } from "./client";

import type { ApiResponse } from "../types/api";
import type { Faq, FaqRequest } from "../types/faq";

export async function getFaqList(): Promise<Faq[]> {
    const res = await client.get<ApiResponse<Faq[]>>("/faqs");
    return res.data.data;
}

export async function createFaq(request: FaqRequest): Promise<void> {
    await client.post<ApiResponse<null>>("/admin/faqs", request);
}

export async function updateFaq(
    id: number,
    request: FaqRequest,
): Promise<void> {
    await client.put<ApiResponse<null>>(`/admin/faqs/${id}`, request);
}

export async function deleteFaq(id: number): Promise<void> {
    await client.delete<ApiResponse<null>>(`/admin/faqs/${id}`);
}