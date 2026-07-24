import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type PurchaseStats = {
  monthSales: number;
  orderCount: number;
  averageOrderValue: number;
  repeatPurchaseRate: number;
  monthlySales: { month: string; amount: number }[];
  topProducts: {
    productId: number;
    name: string;
    quantity: number;
    repeatPurchaseRate: number;
  }[];
};

export async function getPurchaseStats() {
  const response =
    await client.get<ApiResponse<PurchaseStats>>("/admin/stats/purchases");
  return response.data.data;
}
