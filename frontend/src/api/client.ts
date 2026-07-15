import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// 재시도 표시용 (인터셉터 무한루프 방지)
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// 앱 전체가 쓰는 공통 axios 인스턴스
export const client = axios.create({
  baseURL: "/api",
});

// 요청 인터셉터: 모든 요청에 토큰 자동 주입 (자동 로그인 대응)
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
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
        const refreshToken = sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken");
        // refresh 요청은 client 말고 순수 axios로 (인터셉터 재귀 방지)
        const res = await axios.post("/api/auth/refresh", { refreshToken });
        const newAccessToken = res.data.data.accessToken;
        const newRefreshToken = res.data.data.refreshToken;

        // 자동 로그인 여부에 따라 토큰 보관소 분기 처리
        if (localStorage.getItem("accessToken")) {
          localStorage.setItem("accessToken", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }
        } else {
          sessionStorage.setItem("accessToken", newAccessToken);
          if (newRefreshToken) {
            sessionStorage.setItem("refreshToken", newRefreshToken);
          }
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("kopang_auth");
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.dispatchEvent(new Event("auth-change"));
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
