import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// 재시도 표시용 (인터셉터 무한루프 방지)
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// 앱 전체가 쓰는 공통 axios 인스턴스
export const client = axios.create({
  baseURL: "/api",
});

// 요청 인터셉터: 모든 요청에 토큰 자동 주입
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401(TOKEN_EXPIRED)이면 refresh 후 원요청 재시도
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string }>) => {
    const originalRequest = error.config as RetriableConfig;

    if (
      error.response?.status === 401 &&
      error.response.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = sessionStorage.getItem("refreshToken");
        // refresh 요청은 client 말고 순수 axios로 (인터셉터 재귀 방지)
        const res = await axios.post("/api/auth/refresh", { refreshToken });
        const newAccessToken = res.data.data.accessToken;

        sessionStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest); // 원래 요청 재시도
      } catch (refreshError) {
        // refresh 실패 → 로그아웃
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
