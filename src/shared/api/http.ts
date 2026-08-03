import { apiUrl } from "../config/runtimeEnv";

export interface ApiResponse<T> {
  status: number;
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit, accessToken: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), { ...init, headers });
  const body = await response.json().catch(() => null) as ApiResponse<T> | null;
  if (!response.ok || !body?.success) {
    throw new ApiError(body?.message ?? "서버 요청에 실패했습니다.", response.status);
  }
  return body.data;
}
