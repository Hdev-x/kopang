import { http, HttpResponse } from "msw";
import { NOTICES } from "./supportData";

export const handlers = [
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
];
