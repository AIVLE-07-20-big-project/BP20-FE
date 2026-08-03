import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from "../../features/auth/model/authSession";
import { apiUrl } from "../config/runtimeEnv";

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

const REFRESH_PATH = "/api/auth/token/refresh";
const AUTH_REFRESH_EXCLUDED_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  REFRESH_PATH,
  "/api/auth/logout",
]);
const CREDENTIAL_CONFIRMATION_ERROR_CODES = new Set([
  "UNAUTHORIZED_INVALID_PASSWORD",
]);

let refreshPromise: Promise<string | null> | null = null;

function buildRequestHeaders(
  init: RequestInit,
  token: string | null,
  expectJson: boolean,
): Headers {
  const headers = new Headers(init.headers);

  if (expectJson && !headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (
    init.body
    && !(init.body instanceof FormData)
    && !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function performFetch(
  path: string,
  init: RequestInit,
  token: string | null,
  expectJson: boolean,
): Promise<Response> {
  const headers = buildRequestHeaders(init, token, expectJson);

  try {
    return await fetch(apiUrl(path), {
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
}

async function executeRequest(
  path: string,
  init: RequestInit,
  expectJson: boolean,
  allowRefresh: boolean,
): Promise<Response> {
  const token = getAccessToken();
  const response = await performFetch(path, init, token, expectJson);

  if (
    response.status !== 401
    || AUTH_REFRESH_EXCLUDED_PATHS.has(path)
    || await isCredentialConfirmationError(response)
  ) {
    return response;
  }

  if (allowRefresh) {
    const renewedAccessToken = await renewAccessToken();
    if (renewedAccessToken) {
      return performFetch(path, init, renewedAccessToken, expectJson);
    }
  }

  clearAccessToken();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  return response;
}

async function isCredentialConfirmationError(response: Response): Promise<boolean> {
  if (response.status !== 401) return false;

  const errorBody = await response.clone().json().catch(() => null) as ApiErrorPayload | null;
  return Boolean(
    errorBody?.code
    && CREDENTIAL_CONFIRMATION_ERROR_CODES.has(errorBody.code),
  );
}

async function throwForErrorResponse(response: Response): Promise<never> {
  const errorBody = await response.json().catch(() => null) as ApiErrorPayload | null;

  throw new ApiError(
    errorBody?.message
      ?? errorBody?.detail
      ?? errorBody?.error?.message
      ?? "요청 처리 중 오류가 발생했습니다.",
    response.status,
    errorBody?.code,
  );
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const response = await executeRequest(path, init, true, allowRefresh);

  if (!response.ok) {
    return throwForErrorResponse(response);
  }

  const body = await response.json().catch(() => null) as
    | ApiEnvelope<T>
    | T
    | null;

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

/**
 * JSON이 아닌 이미지·HTML 응답을 Response 형태로 반환합니다.
 * 인증 만료 시 JSON API와 동일하게 액세스 토큰을 한 번 갱신한 후 요청을 재시도합니다.
 */
export async function apiRequestRaw(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<Response> {
  const response = await executeRequest(path, init, false, allowRefresh);

  if (!response.ok) {
    return throwForErrorResponse(response);
  }

  return response;
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
    const response = await fetch(apiUrl(REFRESH_PATH), {
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

    saveAccessToken(body.data.accessToken);
    return body.data.accessToken;
  } catch {
    return null;
  }
}
