import { client } from "./client";
import type { ApiResponse } from "../types/api";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: number; name: string };
};

// 로그인 (POST /api/auth/login)
export async function login(email: string, password: string) {
  const res = await client.post<ApiResponse<LoginResponse>>("/auth/login", {
    email,
    password,
  });
  return res.data.data;
}
