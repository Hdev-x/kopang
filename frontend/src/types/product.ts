export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  brand?: string;
  discountRate?: number; // 할인율 (%)
  description?: string;
  stock?: number;
  categoryId?: number; // 속한 카테고리(중분류 또는 소분류) id
};
