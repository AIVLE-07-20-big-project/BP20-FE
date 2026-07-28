import {
  clearAccessToken,
  getAccessToken,
  isAccessTokenRemembered,
  saveAccessToken,
} from "../../features/auth/model/authSession";

export { getAccessToken };

export const AUTH_EXPIRED_EVENT = "bp20:auth-expired";

interface ApiEnvelope<T> {
  status?: number;
  success: boolean;
  message?: string;
  data: T;
}

interface ApiErrorPayload {
  code?: string;
  message?: string;
  detail?: string;
  error?: {
    message?: string;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const REFRESH_PATH = "/api/auth/token/refresh";
const AUTH_REFRESH_EXCLUDED_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  REFRESH_PATH,
  "/api/auth/logout",
]);
const SESSION_AUTH_ERROR_CODES = new Set([
  "UNAUTHORIZED_ACCESS",
  "UNAUTHORIZED_EXPIRED_TOKEN",
  "UNAUTHORIZED_TOKEN_EMPTY",
  "UNAUTHORIZED_INVALID_TOKEN",
]);

let refreshPromise: Promise<string | null> | null = null;

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (
    init.body
    && !(init.body instanceof FormData)
    && !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      "백엔드 서버에 연결할 수 없습니다. 서버 실행 상태와 API 주소를 확인해 주세요.",
      0,
    );
  }

  const body = await response.json().catch(() => null) as
    | ApiEnvelope<T>
    | ApiErrorPayload
    | T
    | null;

  if (!response.ok) {
    const errorBody = body as ApiErrorPayload | null;
    const errorCode = errorBody?.code;
    if (
      response.status === 401
      && !AUTH_REFRESH_EXCLUDED_PATHS.has(path)
      && errorCode
      && SESSION_AUTH_ERROR_CODES.has(errorCode)
    ) {
      if (allowRefresh) {
        const renewedAccessToken = await renewAccessToken();
        if (renewedAccessToken) {
          return apiRequest<T>(path, init, false);
        }
      }
      clearAccessToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    throw new ApiError(
      errorBody?.message
        ?? errorBody?.detail
        ?? errorBody?.error?.message
        ?? "요청 처리 중 오류가 발생했습니다.",
      response.status,
      errorCode,
    );
  }

  if (
    body
    && typeof body === "object"
    && "success" in body
    && "data" in body
  ) {
    const envelope = body as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new ApiError(
        envelope.message ?? "요청 처리 중 오류가 발생했습니다.",
        envelope.status ?? response.status,
      );
    }
    return envelope.data;
  }

  return body as T;
}

async function renewAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken()
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function requestNewAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      return null;
    }

    const body = await response.json() as ApiEnvelope<{
      accessToken: string;
      tokenType: string;
    }>;
    if (!body.success || !body.data?.accessToken) {
      return null;
    }

    saveAccessToken(body.data.accessToken, isAccessTokenRemembered());
    return body.data.accessToken;
  } catch {
    return null;
  }
}
