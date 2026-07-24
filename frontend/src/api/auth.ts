import { client } from "./client";
import type { ApiResponse } from "../types/api";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: number; name: string; role?: "USER" | "ADMIN" };
};

type SignupResponse = {
  id: number;
  email: string;
  name: string;
};

type CheckEmailResponse = {
  exists: boolean;
};

export type UserProfileResponse = {
  userId: number;
  email: string;
  name: string;
  phone?: string;
  birthDate?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

// 로그인 (POST /api/auth/login)
export async function login(email: string, password: string) {
  const res = await client.post<ApiResponse<LoginResponse>>("/auth/login", {
    email,
    password,
  });
  return res.data.data;
}

// 회원가입 (POST /api/auth/signup)
export async function signup(params: {
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  birthDate?: string;
}) {
  const res = await client.post<ApiResponse<SignupResponse>>("/auth/signup", params);
  return res.data.data;
}

// 이메일 중복 체크 (GET /api/auth/check-email)
export async function checkEmail(email: string) {
  const res = await client.get<ApiResponse<CheckEmailResponse>>(`/auth/check-email?email=${encodeURIComponent(email)}`);
  return res.data.data;
}

export type UserAddressResponse = {
  addressId: number;
  userId: number;
  receiver: string;
  phone?: string;
  zipcode?: string;
  address: string;
  detailAddress?: string;
  isDefault: boolean;
};

// 내 정보 조회 (GET /api/users/me)
export async function getProfile() {
  const res = await client.get<ApiResponse<UserProfileResponse>>("/users/me");
  return res.data.data;
}

// 내 기본 배송지 조회 (GET /api/users/me/address)
export async function getUserAddress() {
  const res = await client.get<ApiResponse<UserAddressResponse>>("/users/me/address");
  return res.data.data;
}

// 회원 정보 수정 (PUT /api/users/me)
export async function updateProfile(params: {
  password?: string;
  name?: string;
  phone?: string;
  birthDate?: string;
}) {
  const res = await client.put<ApiResponse<{ message: string }>>("/users/me", params);
  return res.data.data;
}

// 회원 탈퇴 (DELETE /api/users/me)
export async function withdraw() {
  const res = await client.delete<ApiResponse<{ message: string }>>("/users/me");
  return res.data.data;
}

// 비밀번호 찾기 - 인증번호 발송 (POST /api/auth/find-password/send-code)
export async function sendVerificationCode(email: string) {
  const res = await client.post<ApiResponse<{ message: string }>>("/auth/find-password/send-code", { email });
  return res.data.data;
}

// 비밀번호 찾기 - 비밀번호 재설정 (POST /api/auth/find-password/reset)
export async function resetPassword(params: {
  email: string;
  code: string;
  newPassword?: string;
}) {
  const res = await client.post<ApiResponse<{ message: string }>>("/auth/find-password/reset", params);
  return res.data.data;
}

// 아이디 찾기 - 이름과 연락처로 가입된 이메일 조회 (POST /api/auth/find-email)
export async function findEmail(name: string, phone: string) {
  const res = await client.post<ApiResponse<{ email: string }>>("/auth/find-email", { name, phone });
  return res.data.data;
}

// 내 전체 배송지 조회 (GET /api/users/me/addresses)
export async function getUserAddresses() {
  const res = await client.get<ApiResponse<UserAddressResponse[]>>("/users/me/addresses");
  return res.data.data;
}

// 배송지 등록 (POST /api/users/me/addresses)
export async function addAddress(params: {
  receiver: string;
  phone?: string;
  zipcode?: string;
  address: string;
  detailAddress?: string;
  isDefault: boolean;
}) {
  const res = await client.post<ApiResponse<UserAddressResponse>>("/users/me/addresses", params);
  return res.data.data;
}

// 배송지 수정 (PUT /api/users/me/addresses/{id})
export async function updateAddress(addressId: number, params: {
  receiver: string;
  phone?: string;
  zipcode?: string;
  address: string;
  detailAddress?: string;
  isDefault: boolean;
}) {
  const res = await client.put<ApiResponse<void>>(`/users/me/addresses/${addressId}`, params);
  return res.data.data;
}

// 배송지 삭제 (DELETE /api/users/me/addresses/{id})
export async function deleteAddress(addressId: number) {
  const res = await client.delete<ApiResponse<void>>(`/users/me/addresses/${addressId}`);
  return res.data.data;
}

// 기본 배송지 설정 (POST /api/users/me/addresses/{id}/default)
export async function setDefaultAddress(addressId: number) {
  const res = await client.post<ApiResponse<void>>(`/users/me/addresses/${addressId}/default`);
  return res.data.data;
}