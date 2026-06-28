import { http, HttpResponse } from "msw";

// API 명세 초안 기반 mock. 응답은 { success, data, message } 래퍼로 감쌈.
const products = [
  { id: 1, brand: "언탭트", name: "오버핏 피그먼트 반팔 셔츠", price: 34860, discountRate: 30, imageUrl: "" },
  { id: 2, brand: "트릴리온", name: "오버핏 워크 데님 반팔 셔츠", price: 33990, discountRate: 29, imageUrl: "" },
  { id: 3, brand: "토마스모어", name: "페이머 반팔 셔츠 (12color)", price: 47760, discountRate: 20, imageUrl: "" },
  { id: 4, brand: "무드인사이드", name: "썸머 링클 오션 체크셔츠 5color", price: 29900, discountRate: 57, imageUrl: "" },
  { id: 5, brand: "카케이테이", name: "체크 하프 셔츠 (BLACK)", price: 46900, discountRate: 32, imageUrl: "" },
  { id: 6, brand: "파브레가", name: "로렌 스트라이프 크롭 하프 셔츠", price: 66600, discountRate: 10, imageUrl: "" },
  { id: 7, brand: "디스이즈네버댓", name: "아치 로고 반팔 티셔츠", price: 38000, discountRate: 15, imageUrl: "" },
  { id: 8, brand: "커버낫", name: "베이직 옥스포드 셔츠", price: 41000, discountRate: 25, imageUrl: "" },
  { id: 9, brand: "아웃스탠딩", name: "워싱 옥스포드 셔츠", price: 39000, discountRate: 18, imageUrl: "" },
  { id: 10, brand: "드로우핏", name: "세미 오버 셔츠 (3color)", price: 44000, discountRate: 22, imageUrl: "" },
  { id: 11, brand: "예일", name: "베이직 로고 반팔 티셔츠", price: 32000, discountRate: 40, imageUrl: "" },
  { id: 12, brand: "내셔널지오", name: "쿨 코튼 피케 셔츠", price: 36000, discountRate: 12, imageUrl: "" },
];

export const handlers = [
  // 카테고리 목록 (10개)
  http.get("/api/categories", () =>
    HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: "식품", emoji: "🥬" },
        { id: 2, name: "생활용품", emoji: "🧴" },
        { id: 3, name: "가전·디지털", emoji: "💻" },
        { id: 4, name: "패션", emoji: "👕" },
        { id: 5, name: "뷰티", emoji: "💄" },
        { id: 6, name: "도서", emoji: "📚" },
        { id: 7, name: "스포츠", emoji: "⚽" },
        { id: 8, name: "완구·취미", emoji: "🧸" },
        { id: 9, name: "반려동물", emoji: "🐶" },
        { id: 10, name: "자동차", emoji: "🚗" },
      ],
      message: null,
    }),
  ),

  // 상품 목록 (?category= 무시하고 mock은 동일 반환)
  http.get("/api/products", () =>
    HttpResponse.json({
      success: true,
      data: { content: products, number: 0, totalPages: 1, totalElements: products.length },
      message: null,
    }),
  ),

  // 상품 상세
  http.get("/api/products/:id", ({ params }) =>
    HttpResponse.json({
      success: true,
      data: {
        id: Number(params.id),
        brand: "언탭트",
        name: "오버핏 피그먼트 반팔 셔츠",
        price: 34860,
        discountRate: 30,
        description: "오버핏 실루엣의 피그먼트 가공 반팔 셔츠. 데일리로 좋아요.",
        stock: 50,
        imageUrl: "",
      },
      message: null,
    }),
  ),

  // 내 장바구니
  http.get("/api/cart", () =>
    HttpResponse.json({
      success: true,
      data: [
        { itemId: 10, productId: 1, name: "오버핏 피그먼트 반팔 셔츠", price: 34860, quantity: 2, imageUrl: "" },
        { itemId: 11, productId: 4, name: "썸머 링클 오션 체크셔츠", price: 29900, quantity: 1, imageUrl: "" },
      ],
      message: null,
    }),
  ),

  // 로그인
  http.post("/api/auth/login", async ({ request }) => {
    (await request.json()) as { email: string; password: string };
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: "fake-access-token",
        refreshToken: "fake-refresh-token",
        user: { id: 1, name: "홍길동" },
      },
      message: null,
    });
  }),
];
