export interface DetailedDailySales {
  date: string;
  revenue: number;
  transactionCount: number;
  quantity: number;
  averageOrderValue: number;
}

export interface DetailedDriver {
  factor?: string;
  label?: string;
  contributionAmount?: number;
  contributionPct?: number;
}

export interface TopCategory {
  category: string;
  revenue: number;
}

export interface DetailedRootCauseAnalysis {
  change?: { direction?: string; amount?: number; ratePct?: number };
  headline?: string;
  narrative?: string;
  topCategory?: TopCategory | null;
  internalDrivers?: DetailedDriver[];
  internalDetailedDrivers?: DetailedDriver[];
  externalDrivers?: Array<Record<string, unknown>>;
  limitations?: string[];
}

export interface DetailedSalesAnalysis {
  dailySales?: DetailedDailySales[];
  salesBreakdown?: {
    dimensions?: Record<string, Array<{ value: string; revenue: number; revenueSharePct: number; quantity: number; receiptCount: number; averageOrderValue?: number | null }>>;
    hourly?: Array<{ value: string; revenue: number; revenueSharePct: number; receiptCount: number }>;
    weekday?: Array<{ value: string; revenue: number; revenueSharePct: number; receiptCount: number }>;
    daypart?: Array<{ value: string; revenue: number; revenueSharePct: number; receiptCount: number }>;
    weekdayDaypart?: Array<{ value: string; revenue: number; revenueSharePct: number; receiptCount: number }>;
    priceQuantity?: { averageUnitPrice?: number; medianUnitPrice?: number; averageQuantityPerLine?: number };
  };
  eventAnalysis?: {
    available?: boolean;
    eventCount?: number | null;
    eventDays?: number | null;
    exposure?: number | null;
    exposedDays?: number;
    unexposedDays?: number;
    averageDailyRevenueExposed?: number | null;
    averageDailyRevenueUnexposed?: number | null;
    exposedVsUnexposedRevenuePct?: number | null;
    interpretation?: string;
    reason?: string;
  };
  trafficAnalysis?: {
    available?: boolean;
    averageQuarterlyFootTraffic?: number;
    averageDailyRevenue?: number;
    averageDailyTransactions?: number;
    revenuePerFootTraffic?: number;
    transactionsPerFootTrafficPct?: number;
    interpretation?: string;
  };
  rootCauseAnalysis?: DetailedRootCauseAnalysis;
  dataQuality?: { externalDataRegion?: string; warnings?: string[] };
}

export interface AiAnalysisResult {
  analysis_id: string;
  store_id?: string | null;
  report: AiSalesReport;
  diagnosis?: Record<string, unknown>;
  detailed_analysis?: DetailedSalesAnalysis;
  warnings?: unknown[];
  [key: string]: unknown;
}

export type AiAnalysisJobStatus = "queued" | "running" | "completed" | "failed";

export interface AiAnalysisJob {
  job_id: string;
  status: AiAnalysisJobStatus;
  analysis_id?: string | null;
  error_code?: string | null;
  error_message?: string | null;
}

export interface TrendPayload {
  분기: string[];
  계열: Record<string, Array<number | null>>;
}

export interface RatioPayload {
  labels: string[];
  지역별: Record<string, Array<number | null>>;
  원시값: Record<string, Array<number | null>>;
}

export interface AiSalesReport {
  기본정보?: Record<string, string | number | null>;
  "간단분석 정보요약"?: Record<string, string | number | null>;
  매출분석?: Record<string, string | number | null>;
  상단비교요약?: Record<string, Record<string, number | null>>;
  추이?: Record<string, TrendPayload | null>;
  시기별_매출특성?: {
    요일별?: Record<string, RatioPayload | null>;
    시간대별?: Record<string, RatioPayload | null>;
  };
  유동인구_구성?: {
    성별?: RatioPayload | null;
    연령대별?: RatioPayload | null;
    시간대별?: RatioPayload | null;
  };
  "분석결과 해설"?: string | null;
  [key: string]: unknown;
}

export interface CreateAnalysisInput {
  file: File;
  // 최초 업로드 시에만 필요 — 이후로는 서버가 저장해 둔 값을 자동으로 채운다
  trdarCd?: string;
  svcIndutyCd?: string;
  yyquCd?: number;
  storeId?: string;
}

export interface AiStrategyAction {
  방안: string;
  axis?: string;
  [key: string]: unknown;
}

export interface AiRecommendationRun {
  thread_id: string;
  상태: string;
  문제유형?: string | null;
  selected_action?: AiStrategyAction | null;
  candidate_actions?: AiStrategyAction[];
  candidate_status?: Record<string, string> | null;
  scm_result?: Record<string, unknown> | null;
  rag_evidence?: Record<string, unknown> | null;
  ope_result?: Record<string, unknown> | null;
  대기중_승인?: Record<string, unknown> | null;
  warnings?: string[];
  final_report?: Record<string, unknown> | null;
  analysis_id?: string;
  store_id?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export type AiRecommendationDecision = "approve" | "edit" | "reject";
