export interface AiAnalysisResult {
  analysis_id: string;
  report: AiSalesReport;
  diagnosis?: Record<string, unknown>;
  warnings?: unknown[];
  [key: string]: unknown;
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
  "분석결과 해설"?: string | null;
  [key: string]: unknown;
}

export interface CreateAnalysisInput {
  file: File;
  trdarCd: string;
  svcIndutyCd: string;
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
  scm_result?: Record<string, unknown> | null;
  rag_evidence?: Record<string, unknown> | null;
  ope_result?: Record<string, unknown> | null;
  대기중_승인?: Record<string, unknown> | null;
  warnings?: string[];
  final_report?: Record<string, unknown> | null;
  analysis_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export type AiRecommendationDecision = "approve" | "reject";
