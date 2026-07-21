import { client } from "./client";
import type { ApiResponse } from "../types/api";
import type { Faq } from "../types/faq";

export async function getFaqList(): Promise<Faq[]> {
  const res = await client.get<ApiResponse<Faq[]>>("/faqs");
  return res.data.data;
}
