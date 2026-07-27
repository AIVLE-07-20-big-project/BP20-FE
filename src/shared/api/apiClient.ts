const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "bp20:access-token";

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function getAccessToken() {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(token: string | null) {
  if (token) window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | { message?: string; detail?: string; error?: { message?: string } } | T | null;

  if (!response.ok) {
    const errorPayload = payload as { message?: string; detail?: string; error?: { message?: string } } | null;
    throw new ApiError(errorPayload?.message ?? errorPayload?.detail ?? errorPayload?.error?.message ?? `요청에 실패했습니다. (${response.status})`, response.status);
  }
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}
