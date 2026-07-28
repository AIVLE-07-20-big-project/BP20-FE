/**
 * 백엔드(BP20-BE)와 통신하는 공용 fetch 래퍼.
 *
 * 백엔드의 모든 JSON 응답은 { status, success, message, data } 형태로 감싸져 오므로
 * (com.bp20.backend.global.response.ApiResponse 참고), 이 파일에서 그 포맷을 한 곳에서만
 * 다루고, 나머지 코드는 그냥 필요한 데이터(T)만 돌려받도록 한다.
 *
 * 단, GET /api/analytics/report 처럼 JSON이 아니라 HTML을 그대로 반환하는 엔드포인트는
 * 이 포맷을 따르지 않으므로 apiGetText로 별도 처리한다.
 */

import { AUTH_EXPIRED_EVENT } from "./apiClient";
import { getAccessToken } from "./authToken";

export interface BackendApiResponse<T> {
  status: number;
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// 팀 컨벤션: 개발 환경에선 VITE_API_BASE_URL을 비워두고 Vite 프록시(/api → 백엔드)를 쓴다.
// (apiClient.ts와 동일한 방식) 배포 환경에서만 실제 API 주소를 채워 넣는다.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

type QueryParams = Record<string, string | number | boolean | undefined>;

function buildUrl(path: string, params?: QueryParams): string {
  // API_BASE_URL이 빈 문자열이면(=상대경로) 현재 페이지 origin을 기준으로 해석해서
  // Vite 개발서버 프록시가 "/api" 요청을 백엔드로 대신 전달해주도록 한다.
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

/** 로그인 되어 있으면(토큰이 있으면) Authorization 헤더를 붙여서 돌려준다. */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAccessToken(); // 순수 토큰 값 (Bearer 접두사 없음)
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function unwrap<T>(response: Response): Promise<T> {
  let body: BackendApiResponse<T> | undefined;
  try {
    body = (await response.json()) as BackendApiResponse<T>;
  } catch {
    throw new ApiError(response.status, "서버 응답을 해석할 수 없습니다.");
  }

  if (!response.ok || !body.success) {
    if (response.status === 401 && getAccessToken()) {
      // 토큰은 있었는데 401이면 만료된 것 — AuthProvider가 로그아웃 처리하도록 알림
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(body.status ?? response.status, body.message ?? "요청 처리 중 오류가 발생했습니다.");
  }

  return body.data;
}

/** GET 요청 (JSON 응답, ApiResponse로 감싸져 있는 것) */
export async function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  const response = await fetch(buildUrl(path, params), { headers: authHeaders() });
  return unwrap<T>(response);
}

/** POST 요청 (JSON 본문, JSON 응답) */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return unwrap<T>(response);
}

/** 파일 업로드 POST 요청 (multipart/form-data). extraFields로 파일 외 다른 폼 필드도 같이 보낼 수 있다. */
export async function apiPostFile<T>(
  path: string,
  file: File,
  fieldName = "file",
  extraFields?: Record<string, string>
): Promise<T> {
  // 파일을 File 객체 그대로 넘기면, 브라우저가 "전송하는 시점"에 디스크에서 다시 읽어온다.
  // 그 사이에 백신/색인 서비스 등이 파일을 살짝 건드리기만 해도 크롬이
  // ERR_UPLOAD_FILE_CHANGED로 업로드를 막아버리는 문제가 있다.
  // 선택하자마자 메모리에 통째로 읽어들인 뒤 그 사본(Blob)을 업로드하면,
  // 이후로는 디스크를 다시 쳐다볼 일이 없어서 이 문제를 원천적으로 피할 수 있다.
  const buffer = await file.arrayBuffer();
  const fileCopy = new Blob([buffer], { type: file.type });

  const formData = new FormData();
  formData.append(fieldName, fileCopy, file.name);
  if (extraFields) {
    Object.entries(extraFields).forEach(([key, value]) => formData.append(key, value));
  }

  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return unwrap<T>(response);
}

/**
 * 파일 업로드 POST 요청인데, 응답이 ApiResponse(JSON)가 아니라 이미지 등 바이너리 그대로 오는 엔드포인트용.
 * (예: AI 상품 이미지 생성 — 성공 시 image/png 바이트를 그대로 반환)
 */
export async function apiPostFileForBlob(
  path: string,
  file: File,
  fieldName = "file",
  extraFields?: Record<string, string>
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const fileCopy = new Blob([buffer], { type: file.type });

  const formData = new FormData();
  formData.append(fieldName, fileCopy, file.name);
  if (extraFields) {
    Object.entries(extraFields).forEach(([key, value]) => formData.append(key, value));
  }

  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    // 에러 응답은 이미지가 아니라 평소처럼 ApiResponse(JSON) 형태로 온다.
    let message = "요청 처리 중 오류가 발생했습니다.";
    try {
      const errorBody = (await response.json()) as BackendApiResponse<unknown>;
      message = errorBody.message ?? message;
    } catch {
      // 응답이 JSON이 아니면 기본 메시지 유지
    }
    if (response.status === 401 && getAccessToken()) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(response.status, message);
  }

  return response.blob();
}

/** ApiResponse로 감싸져 있지 않고, 텍스트(HTML 등)를 그대로 반환하는 엔드포인트용 */
export async function apiGetText(path: string, params?: QueryParams): Promise<string> {
  const response = await fetch(buildUrl(path, params), { headers: authHeaders() });
  if (!response.ok) {
    throw new ApiError(response.status, "요청을 처리하지 못했습니다.");
  }
  return response.text();
}