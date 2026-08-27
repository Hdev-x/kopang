export type CartItem = {
  itemId: number;
  productId: number;
  name: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number;
  quantity: number;
  imageUrl: string;
  addedAt?: string;
};
