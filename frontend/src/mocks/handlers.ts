import { http, HttpResponse } from "msw";
import { mockProducts, categoryTree } from "./categoryData";
import { ensureRealImages } from "./dummyImages";
import { qnaPosts } from "./qnaData";
import { NOTICES } from "./supportData";

// API 명세 초안 기반 mock. 응답은 { success, data, message } 래퍼로 감쌈.
export const handlers = [

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

  // 상품 목록
  http.get("/api/products", async ({ request }) => {
    await ensureRealImages(mockProducts);

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 20);

    const start = page * size;
    const content = mockProducts.slice(start, start + size);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        number: page,
        totalPages: Math.ceil(mockProducts.length / size),
        totalElements: mockProducts.length,
      },
      message: null,
    });
  }),

  // 카테고리 목록
  http.get("/api/categories", () =>
    HttpResponse.json({
      success: true,
      data: categoryTree,
      message: null,
    }),
  ),

  // 공지사항 목록
  http.get("/api/notices", () =>
    HttpResponse.json({
      success: true,
      data: NOTICES.map((notice, index) => ({
        id: index + 1,
        title: notice.title,
        content: notice.content,
        createdAt: notice.date,
      })),
      message: null,
    }),
  ),



  // 공지사항 상세
  http.get("/api/notices/:id", ({ params }) => {
    const notice = NOTICES[Number(params.id) - 1];

    return HttpResponse.json({
      success: true,
      data: {
        id: Number(params.id),
        title: notice.title,
        content: notice.content,
        createdAt: notice.date,
      },
      message: null,
    });
  }),
  // 내 장바구니 — 상품 정보는 실제 목 상품에서 끌어와 일관성 유지
  // http.get("/api/cart", async () => {
  //   await ensureRealImages(mockProducts);
  //   const data = [
  //     { itemId: 10, productId: 1, quantity: 2 },
  //     { itemId: 11, productId: 8, quantity: 1 },
  //   ].map((c) => {
  //     const p = mockProducts.find((x) => x.id === c.productId);
  //     return {
  //       itemId: c.itemId,
  //       productId: c.productId,
  //       name: p?.name ?? "상품",
  //       price: p?.price ?? 0,
  //       quantity: c.quantity,
  //       imageUrl: p?.imageUrl ?? "",
  //     };
  //   });
  //   return HttpResponse.json({ success: true, data, message: null });
  // }),

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

  // 1:1 문의 목록 - API 명세서 주소
  http.get("/api/inquiries", ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    const filteredPosts = type
      ? qnaPosts.filter((q) => q.type === type)
      : qnaPosts;

    return HttpResponse.json({
      success: true,
      data: filteredPosts.map((q) => ({
        id: q.id,
        type: q.type,
        productId: q.productId,
        title: q.title,
        author: q.author,
        status: q.status,
        createdAt: q.createdAt,
        answerContent: q.answerContent,
      })),
      message: null,
    });
  }),

  // 상품별 문의 목록
  http.get("/api/inquiries/product/:productId", ({ params }) => {
    const productId = Number(params.productId);

    const productPosts = qnaPosts.filter(
      (q) => q.type === "PRODUCT" && q.productId === productId
    );

    return HttpResponse.json({
      success: true,
      data: productPosts.map((q) => ({
        id: q.id,
        type: q.type,
        productId: q.productId,
        title: q.title,
        author: q.author,
        status: q.status,
        createdAt: q.createdAt,
        answerContent: q.answerContent,
      })),
      message: null,
    });
  }),

  // 1:1 문의 상세 - API 명세서 주소
  http.get("/api/inquiries/:id", ({ params }) => {
    const post = qnaPosts.find((q) => q.id === Number(params.id));
    return HttpResponse.json({
      success: !!post,
      data: post ?? null,
      message: post ? null : "NOT_FOUND",
    });
  }),

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
      status: "답변대기" as const,
      createdAt: "2026.06.30",
    };

    qnaPosts.unshift(created);

    return HttpResponse.json({ success: true, data: created, message: null });
  }),

  // 1:1 문의 작성 - API 명세서 주소
  http.post("/api/inquiries", async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      content: string
      type?: "PRODUCT" | "GENERAL"
      productId?: number;
    };
    const created = {
      id: qnaPosts.length + 1,
      type: body.type ?? "GENERAL",
      productId: body.productId,
      title: body.title,
      content: body.content,
      author: "홍**",
      status: "답변대기" as const,
      createdAt: "2026.06.30",
    };

    qnaPosts.unshift(created);

    return HttpResponse.json({ success: true, data: created, message: null });
  }),


  // 1:1 문의 답변 등록
  http.post("/api/qna/:id/answer", async ({ params, request }) => {
    const body = (await request.json()) as { answerContent: string };
    const post = qnaPosts.find((q) => q.id === Number(params.id));

    if (!post) {
      return HttpResponse.json(
        { success: false, data: null, message: "NOT_FOUND" },
        { status: 404 },
      );
    }

    post.answerContent = body.answerContent;
    post.status = "답변완료";

    return HttpResponse.json({ success: true, data: null, message: null });
  }),

  // 1:1 문의 답변 등록 - API 명세서 주소
  http.post("/api/inquiries/:id/answer", async ({ params, request }) => {
    const body = (await request.json()) as { answerContent: string };
    const post = qnaPosts.find((q) => q.id === Number(params.id));

    if (!post) {
      return HttpResponse.json(
        { success: false, data: null, message: "NOT_FOUND" },
        { status: 404 },
      );
    }

    post.answerContent = body.answerContent;
    post.status = "답변완료";

    return HttpResponse.json({ success: true, data: null, message: null });

  }),
];

