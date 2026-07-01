import { http, HttpResponse } from "msw";
import { categoryTree, mockProducts, collectDescendantIds } from "./categoryData";
import { ensureRealImages } from "./dummyImages";
import { qnaPosts } from "./qnaData";

// API 명세 초안 기반 mock. 응답은 { success, data, message } 래퍼로 감쌈.
export const handlers = [
  // 카테고리 트리 (대 > 중 > 소)
  http.get("/api/categories", () =>
    HttpResponse.json({ success: true, data: categoryTree, message: null }),
  ),

  // 상품 목록 — ?cat=<카테고리id> 면 그 카테고리 + 하위 전체
  http.get("/api/products", async ({ request }) => {
    await ensureRealImages(mockProducts); // 커버되는 카테고리는 실사진으로 교체(최초 1회)
    const cat = new URL(request.url).searchParams.get("cat");
    let list = mockProducts;
    if (cat) {
      const ids = collectDescendantIds(Number(cat));
      list = mockProducts.filter((p) => p.categoryId != null && ids.has(p.categoryId));
    } else {
      // 홈 등 전체 호출: 카테고리 전반에서 고르게 샘플링
      const step = Math.max(1, Math.floor(mockProducts.length / 40));
      list = mockProducts.filter((_, i) => i % step === 0);
    }
    const content = list.slice(0, 40);
    return HttpResponse.json({
      success: true,
      data: { content, number: 0, totalPages: 1, totalElements: list.length },
      message: null,
    });
  }),

  // 상품 상세
  http.get("/api/products/:id", async ({ params }) => {
    await ensureRealImages(mockProducts);
    const p = mockProducts.find((x) => x.id === Number(params.id)) ?? mockProducts[0];
    return HttpResponse.json({
      success: true,
      data: { ...p, description: `${p.name} — 데일리로 좋은 ${p.brand} 제품입니다.`, stock: 50 },
      message: null,
    });
  }),

  // 내 장바구니 — 상품 정보는 실제 목 상품에서 끌어와 일관성 유지
  http.get("/api/cart", async () => {
    await ensureRealImages(mockProducts);
    const data = [
      { itemId: 10, productId: 1, quantity: 2 },
      { itemId: 11, productId: 8, quantity: 1 },
    ].map((c) => {
      const p = mockProducts.find((x) => x.id === c.productId);
      return {
        itemId: c.itemId,
        productId: c.productId,
        name: p?.name ?? "상품",
        price: p?.price ?? 0,
        quantity: c.quantity,
        imageUrl: p?.imageUrl ?? "",
      };
    });
    return HttpResponse.json({ success: true, data, message: null });
  }),

  // 1:1 문의 목록 (요약: 본문·답변 제외)
  http.get("/api/qna", () =>
    HttpResponse.json({
      success: true,
      data: qnaPosts.map((q) => ({
        id: q.id,
        title: q.title,
        author: q.author,
        status: q.status,
        createdAt: q.createdAt,
      })),
      message: null,
    }),
  ),

  // 1:1 문의 상세
  http.get("/api/qna/:id", ({ params }) => {
    const post = qnaPosts.find((q) => q.id === Number(params.id));
    return HttpResponse.json({
      success: !!post,
      data: post ?? null,
      message: post ? null : "NOT_FOUND",
    });
  }),

  // 1:1 문의 작성
  http.post("/api/qna", async ({ request }) => {
    const body = (await request.json()) as { title: string; content: string };
    const created = {
      id: qnaPosts.length + 1,
      title: body.title,
      content: body.content,
      author: "홍**",
      status: "답변대기",
      createdAt: "2026.06.30",
    };
    return HttpResponse.json({ success: true, data: created, message: null });
  }),

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
