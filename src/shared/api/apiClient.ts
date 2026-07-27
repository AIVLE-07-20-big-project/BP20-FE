import {
  clearAccessToken,
  getAccessToken,
} from "../../features/auth/model/authSession";

export const AUTH_EXPIRED_EVENT = "bp20:auth-expired";

interface ApiEnvelope<T> {
  status: number;
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
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

  if (init.body && !headers.has("Content-Type")) {
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

  const body = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !body?.success) {
    if (response.status === 401 && token) {
      clearAccessToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(
      body?.message ?? "요청 처리 중 오류가 발생했습니다.",
      response.status,
    );
  }

  return body.data;
}
