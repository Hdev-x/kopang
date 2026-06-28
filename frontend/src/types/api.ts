// API 공통 응답 래퍼 (API_명세_초안 기준)
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

// Spring Page 포맷
export type Page<T> = {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
};
