/**
 * 1원 단위 절사 (Truncate ones digit to 0)
 * 예: 28,161원 -> 28,160원 / 28,169원 -> 28,160원
 */
export function floorToTen(price: number): number {
  if (!price || isNaN(price) || price <= 0) return 0;
  return Math.floor(price / 10) * 10;
}

/**
 * 할인율 적용 후 1원 단위 절사 가격 계산
 */
export function calculateSalePrice(price: number, discountRate?: number): number {
  if (!price || isNaN(price)) return 0;
  if (!discountRate || discountRate <= 0) {
    return floorToTen(price);
  }
  const rawSalePrice = (price * (100 - discountRate)) / 100;
  return floorToTen(rawSalePrice);
}

/**
 * 가격 1원 단위 절사 후 쉼표 포맷팅된 문자열 반환 (예: "28,160")
 */
export function formatPrice(price: number, discountRate?: number): string {
  return calculateSalePrice(price, discountRate).toLocaleString();
}
