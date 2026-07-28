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
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function buildRequestHeaders(init: RequestInit, token: string | null, expectJson: boolean): Headers {
  const headers = new Headers(init.headers);

  // JSON 응답을 기대하는 apiRequest만 Accept: application/json을 강제한다.
  // 리포트(text/html)·이미지 생성(image/png)처럼 JSON이 아닌 응답을 주는 엔드포인트에
  // 이 헤더를 붙이면, 백엔드가 콘텐츠 협상에 실패해서 500을 내는 문제가 있었다.
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

async function performFetch(path: string, init: RequestInit, token: string | null, expectJson: boolean): Promise<Response> {
  const headers = buildRequestHeaders(init, token, expectJson);
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      "백엔드 서버에 연결할 수 없습니다. 서버 실행 상태와 API 주소를 확인해 주세요.",
      0,
    );
  }
}

async function throwForErrorResponse(response: Response, token: string | null): Promise<never> {
  if (response.status === 401 && token) {
    clearAccessToken();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }

  const errorBody = await response.json().catch(() => null) as ApiErrorPayload | null;
  throw new ApiError(
    errorBody?.message
      ?? errorBody?.detail
      ?? errorBody?.error?.message
      ?? "요청 처리 중 오류가 발생했습니다.",
    response.status,
  );
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const response = await performFetch(path, init, token, true);

  if (!response.ok) {
    return throwForErrorResponse(response, token);
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
 * apiRequest와 인증/에러 처리는 동일하지만, 응답 바디를 JSON으로 파싱하지 않고
 * Response 객체를 그대로 돌려준다. 이미지(Blob)나 HTML(text)처럼 ApiResponse
 * JSON 봉투로 감싸져 있지 않은 엔드포인트를 호출할 때 사용한다.
 * (예: AI 상품 이미지 생성 - image/png, AI 가계부 HTML 리포트 - text/html)
 *
 * Accept: application/json을 강제하지 않는다 — 강제하면 백엔드가 text/html·image/png를
 * 내려주려 할 때 콘텐츠 협상에 실패해서 500이 나는 문제가 있었다.
 */
export async function apiRequestRaw(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken();
  const response = await performFetch(path, init, token, false);

  if (!response.ok) {
    return throwForErrorResponse(response, token);
  }

  return response;
}