import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { logout } from "../lib/auth";

// 재시도 표시용 (인터셉터 무한루프 방지)
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// 앱 전체가 쓰는 공통 axios 인스턴스
export const client = axios.create({
  baseURL: "/api",
});

// 토큰 재발급 진행 중 여부 및 대기 큐(Promise Queue)
let isRefreshing = false;
type SubscriberCallback = (error: Error | AxiosError | null, token?: string) => void;
let refreshSubscribers: SubscriberCallback[] = [];

function onRefreshed(error: Error | AxiosError | null, token?: string) {
  refreshSubscribers.forEach((cb) => cb(error, token));
  refreshSubscribers = [];
}

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

      // 이미 토큰 재발급이 진행 중이면 큐에 등록하고 완료 후 대기된 원래 요청 실행
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((err, newToken) => {
            if (err) {
              reject(err);
            } else if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(client(originalRequest));
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // refresh 요청은 client 말고 순수 axios로 (인터셉터 재귀 방지)
        const res = await axios.post("/api/auth/refresh", { refreshToken });
        const newAccessToken = res.data.data.accessToken;
        const newRefreshToken = res.data.data.refreshToken;

        // 기존에 토큰이 저장되어 있던 위치(refreshToken 저장 장소 기준) 파악하여 동적 갱신
        const isLocalStorage = Boolean(localStorage.getItem("refreshToken"));
        const targetStorage = isLocalStorage ? localStorage : sessionStorage;

        targetStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          targetStorage.setItem("refreshToken", newRefreshToken);
        }

        onRefreshed(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshed(refreshError as Error);
        logout(); // 공통 로그아웃 처리 (sessionStorage, localStorage 모두 청소 + 이벤트 발행)
        // Web(/web/*)과 Mobile은 로그인 화면이 따로다. 경로를 고정하면 Web 사용 중 모바일 화면으로 튄다.
        window.location.href = window.location.pathname.startsWith("/web") ? "/web/login" : "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
