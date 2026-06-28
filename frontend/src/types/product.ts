export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  brand?: string;
  discountRate?: number; // 할인율 (%)
  description?: string;
  stock?: number;
};
