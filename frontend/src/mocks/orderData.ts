// 목업 주문 데이터. 상품 정보(이름·가격·이미지)는 실제 목 상품에서 끌어와 일관성 유지.
import { mockProducts } from "./categoryData";
import type { Product } from "../types/product";

export type OrderLine = { productId: number; qty: number };
export type TrackStep = { step: string; done: boolean };
export type Order = {
  no: string;
  date: string;
  status: string;
  items: OrderLine[];
  tracking: TrackStep[];
};

const byId = new Map<number, Product>(mockProducts.map((p) => [p.id, p]));
export const productOf = (id: number): Product | undefined => byId.get(id);

const STEPS = ["결제완료", "상품준비중", "배송중", "배송완료"];
const track = (active: number): TrackStep[] =>
  STEPS.map((step, i) => ({ step, done: i <= active }));

export const ORDERS: Order[] = [
  {
    no: "C00125",
    date: "2026.06.28",
    status: "배송완료",
    items: [{ productId: 1, qty: 1 }, { productId: 8, qty: 1 }],
    tracking: track(3),
  },
  {
    no: "C00124",
    date: "2026.06.20",
    status: "배송중",
    items: [{ productId: 20, qty: 1 }],
    tracking: track(2),
  },
  {
    no: "C00123",
    date: "2026.06.12",
    status: "결제완료",
    items: [{ productId: 30, qty: 2 }],
    tracking: track(0),
  },
];

export const findOrder = (no: string): Order | undefined => ORDERS.find((o) => o.no === no);
export const orderTotal = (o: Order): number =>
  o.items.reduce((s, it) => s + (productOf(it.productId)?.price ?? 0) * it.qty, 0);
