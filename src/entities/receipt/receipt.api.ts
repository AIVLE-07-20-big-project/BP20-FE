import { apiRequest, apiRequestRaw } from "@/shared/api/apiClient";
import type {
  BudgetOverageResponse,
  ExpenseAnomalyResponse,
  LedgerReportOptions,
  OcrParseResponse,
  ReceiptCreateRequest,
  ReceiptPageResponse,
  ReceiptResponse,
  ReceiptUpdateRequest,
} from "./receipt.types";

type QueryParams = Record<string, string | number | boolean | undefined>;

function toQueryString(params: QueryParams): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * 파일을 그대로 넘기면 브라우저가 "전송 시점"에 디스크에서 다시 읽어오는데,
 * 그 사이 백신/색인 서비스가 파일을 살짝 건드리기만 해도 ERR_UPLOAD_FILE_CHANGED로
 * 업로드가 막히는 문제가 있다. 선택 즉시 메모리로 읽어들인 사본을 올리면 이 문제를 피한다.
 */
async function toUploadableCopy(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  return new Blob([buffer], { type: file.type });
}

/** 영수증 이미지를 업로드해서 OCR 결과를 미리 본다. (DB 저장은 안 함) */
export async function parseReceiptImage(file: File): Promise<OcrParseResponse> {
  const formData = new FormData();
  formData.append("file", await toUploadableCopy(file), file.name);
  return apiRequest<OcrParseResponse>("/api/store-owner/receipts/parse", {
    method: "POST",
    body: formData,
  });
}

/** 검토·수정된 영수증을 최종 저장한다. 중복 의심이면 ApiError(status=409)가 던져진다. */
export function createReceipt(payload: ReceiptCreateRequest): Promise<ReceiptResponse> {
  return apiRequest<ReceiptResponse>("/api/store-owner/receipts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getReceipt(receiptId: number): Promise<ReceiptResponse> {
  return apiRequest<ReceiptResponse>(`/api/store-owner/receipts/${receiptId}`);
}

/** 업로드 내역 목록 (30건 단위 페이지네이션). page는 0부터 시작한다. */
export function getReceipts(storeId: number, page = 0, size = 30): Promise<ReceiptPageResponse> {
  return apiRequest<ReceiptPageResponse>(
    `/api/store-owner/receipts${toQueryString({ storeId, page, size })}`
  );
}

/** 업로드 내역에서 영수증을 직접 수정한다. */
export function updateReceipt(receiptId: number, payload: ReceiptUpdateRequest): Promise<ReceiptResponse> {
  return apiRequest<ReceiptResponse>(`/api/store-owner/receipts/${receiptId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** 업로드 내역에서 영수증을 삭제한다. */
export function deleteReceipt(receiptId: number): Promise<void> {
  return apiRequest<void>(`/api/store-owner/receipts/${receiptId}`, {
    method: "DELETE",
  });
}

/** 이상 지출 탐지 (2번 AI 가계부) */
export function getExpenseAnomalies(storeId: number, zThreshold = 1.3): Promise<ExpenseAnomalyResponse[]> {
  return apiRequest<ExpenseAnomalyResponse[]>(
    `/api/store-owner/analytics/expense-anomalies${toQueryString({ storeId, zThreshold })}`
  );
}

/** 예산 초과 확인 (2번 AI 가계부) */
export function getBudgetOverage(storeId: number): Promise<BudgetOverageResponse[]> {
  return apiRequest<BudgetOverageResponse[]>(
    `/api/store-owner/analytics/budget-overage${toQueryString({ storeId })}`
  );
}

/** 경영 장부 HTML 리포트 (월간/연간/총기간). 반환값은 완성된 HTML 문자열. */
export async function getLedgerReportHtml(storeId: number, options?: LedgerReportOptions): Promise<string> {
  const query = toQueryString({
    storeId,
    storeName: options?.storeName,
    reportType: options?.reportType,
    year: options?.year,
    month: options?.month,
  });
  const response = await apiRequestRaw(`/api/store-owner/analytics/report${query}`);
  return response.text();
}
