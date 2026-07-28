import {
  clearAccessToken,
  getAccessToken,
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

const SESSION_AUTH_ERROR_CODES = new Set([
  "UNAUTHORIZED_ACCESS",
  "UNAUTHORIZED_EXPIRED_TOKEN",
  "UNAUTHORIZED_TOKEN_EMPTY",
  "UNAUTHORIZED_INVALID_TOKEN",
]);

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

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
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
      && token
      && errorCode
      && SESSION_AUTH_ERROR_CODES.has(errorCode)
    ) {
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
