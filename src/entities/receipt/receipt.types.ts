/**
 * 백엔드(BP20-BE)의 Receipt 관련 DTO와 1:1로 대응하는 타입들.
 * 필드명은 백엔드 JSON과 완전히 동일하게 맞춘다 (camelCase 그대로).
 */

export interface ReceiptItemData {
  itemName: string;
  quantity: number;
  unit: string | null;
  unitPrice: number | null;
  totalPrice: number;
}

/** POST /api/receipts/parse 응답의 result 부분 (OCR 파싱 결과, 아직 저장 전) */
export interface ReceiptParseResult {
  documentType: string;
  storeName: string | null;
  businessNumber: string | null;
  transactionDate: string; // "YYYY-MM-DD"
  transactionTime: string | null; // "HH:mm"
  paymentMethod: string;
  items: ReceiptItemData[];
  supplyAmount: number | null;
  vat: number | null;
  taxFreeAmount: number | null;
  totalAmount: number;
  category: string;
}

export interface OcrParseResponse {
  ocrText: string[];
  processedImage: string;
  result: ReceiptParseResult;
}

/** POST /api/receipts 요청 (검토/수정 후 최종 저장 확정) */
export interface ReceiptCreateRequest {
  storeId: number;
  uploadedByUserId?: number;
  documentType: string;
  storeName: string | null;
  businessNumber: string | null;
  transactionDate: string;
  transactionTime: string | null;
  paymentMethod: string;
  items: ReceiptItemData[];
  supplyAmount: number | null;
  vat: number | null;
  taxFreeAmount: number | null;
  totalAmount: number;
  category: string;
  rawImagePath?: string;
  /** 중복 의심이어도 강제로 저장할지 여부. 처음엔 항상 false로 보내고, 409가 나면 true로 재요청 */
  force: boolean;
}

export type ReceiptStatus = "CONFIRMED" | "NEEDS_REVIEW" | "DUPLICATE_SUSPECTED";

export interface ReceiptResponse {
  receiptId: number;
  storeId: number;
  documentType: string;
  vendorName: string | null;
  businessNumber: string | null;
  transactionDate: string;
  transactionTime: string | null;
  paymentMethod: string;
  category: string;
  supplyAmount: number | null;
  vat: number | null;
  taxFreeAmount: number;
  totalAmount: number;
  status: ReceiptStatus;
  items: ReceiptItemData[];
}

export interface ExpenseAnomalyResponse {
  category: string;
  week: string; // "YYYY-MM-DD" (해당 주의 시작일)
  weeklyAmount: number;
  categoryAvg: number;
  zScore: number;
  direction: "급증" | "급감";
}

export interface BudgetOverageResponse {
  yearMonth: string; // "YYYY-MM"
  category: string;
  actualAmount: number;
  budgetAmount: number;
  overAmount: number;
  /** 해당 월/카테고리에 예산 자체가 등록 안 되어있으면 null */
  overPct: number | null;
}

/** 업로드 내역 수정 요청 (POST 요청과 필드 구성은 같되 storeId/force는 뺐다) */
export interface ReceiptUpdateRequest {
  documentType: string;
  storeName: string | null;
  businessNumber: string | null;
  transactionDate: string;
  transactionTime: string | null;
  paymentMethod: string;
  items: ReceiptItemData[];
  supplyAmount: number | null;
  vat: number | null;
  taxFreeAmount: number | null;
  totalAmount: number;
  category: string;
}

export interface ReceiptPageResponse {
  content: ReceiptResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export type ReportType = "monthly" | "yearly" | "full";

export interface LedgerReportOptions {
  storeName?: string;
  reportType?: ReportType;
  year?: number;
  month?: number;
}

export type ReceiptUpdateRequest = Omit<ReceiptCreateRequest, "storeId" | "uploadedByUserId" | "rawImagePath" | "force">;
