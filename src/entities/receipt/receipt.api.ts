import { apiGet, apiGetText, apiPost, apiPostFile } from "@/shared/api/httpClient";
import type {
  BudgetOverageResponse,
  ExpenseAnomalyResponse,
  LedgerReportOptions,
  OcrParseResponse,
  ReceiptCreateRequest,
  ReceiptResponse,
} from "./receipt.types";

/** 영수증 이미지를 업로드해서 OCR 결과를 미리 본다. (DB 저장은 안 함) */
export function parseReceiptImage(file: File): Promise<OcrParseResponse> {
  return apiPostFile<OcrParseResponse>("/api/store-owner/receipts/parse", file);
}

/** 검토·수정된 영수증을 최종 저장한다. 중복 의심이면 ApiError(status=409)가 던져진다. */
export function createReceipt(payload: ReceiptCreateRequest): Promise<ReceiptResponse> {
  return apiPost<ReceiptResponse>("/api/store-owner/receipts", payload);
}

export function getReceipt(receiptId: number): Promise<ReceiptResponse> {
  return apiGet<ReceiptResponse>(`/api/store-owner/receipts/${receiptId}`);
}

export function getReceipts(storeId: number): Promise<ReceiptResponse[]> {
  return apiGet<ReceiptResponse[]>("/api/store-owner/receipts", { storeId });
}

/** 이상 지출 탐지 (2번 AI 가계부) */
export function getExpenseAnomalies(storeId: number, zThreshold = 1.3): Promise<ExpenseAnomalyResponse[]> {
  return apiGet<ExpenseAnomalyResponse[]>("/api/store-owner/analytics/expense-anomalies", { storeId, zThreshold });
}

/** 예산 초과 확인 (2번 AI 가계부) */
export function getBudgetOverage(storeId: number): Promise<BudgetOverageResponse[]> {
  return apiGet<BudgetOverageResponse[]>("/api/store-owner/analytics/budget-overage", { storeId });
}

/** 경영 장부 HTML 리포트 (월간/연간/총기간). 반환값은 완성된 HTML 문자열. */
export function getLedgerReportHtml(storeId: number, options?: LedgerReportOptions): Promise<string> {
  return apiGetText("/api/store-owner/analytics/report", {
    storeId,
    storeName: options?.storeName,
    reportType: options?.reportType,
    year: options?.year,
    month: options?.month,
  });
}