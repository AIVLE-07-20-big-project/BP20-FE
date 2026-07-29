export type RecommendationType = "SALES" | "REVIEW";

export type VerificationStatus = "COLLECTING" | "READY" | "VERIFIED" | "FAILED";

export interface VerificationCondition {
  period_days?: number;
  start_hour?: number | null;
  end_hour?: number | null;
  compare_same_weekday?: boolean;
  target_aspect?: string | null;
}

export interface SalesVerificationMetrics {
  target_sales: number;
  visit_count: number;
  average_order_value: number;
  revisit_rate: number;
  coupon_usage_rate: number;
  new_customer_count: number;
  dormant_customer_return_count: number;
  total_sales: number;
}

export interface ReviewVerificationMetrics {
  average_rating: number;
  negative_review_rate: number;
  target_aspect_review_count: number;
  target_aspect_negative_rate: number;
  target_aspect_average_confidence: number;
  review_count: number;
  revisit_rate: number;
  sales: number;
}

export interface VerificationPeriodMetrics {
  sales?: SalesVerificationMetrics | null;
  review?: ReviewVerificationMetrics | null;
}

export interface RegisterVerificationExecutionInput {
  recommendation_id?: string;
  thread_id: string;
  decision_id?: string | null;
  store_id: number;
  recommendation_type: RecommendationType;
  condition: VerificationCondition;
  before: VerificationPeriodMetrics;
  executed_at?: string;
}

export interface RegisterMockThreadExecutionInput {
  store_id: number;
  recommendation_type: RecommendationType;
  condition: VerificationCondition;
  executed_at?: string;
}

export interface VerificationExecution {
  store_id: number;
  recommendation_id: string;
  thread_id: string | null;
  decision_id: string | null;
  recommendation_type: RecommendationType;
  status: VerificationStatus;
  executed_at: string;
  verification_due_at: string;
  verified_at: string | null;
  failure_reason: string | null;
  attempt_count: number;
  last_attempt_at: string | null;
}

export interface VerificationCandidateRecommendation {
  thread_id: string;
  store_id?: string | number | null;
  approval_status?: string | null;
  selected_action?: {
    방안: string;
    axis?: string | null;
  } | null;
  final_report?: Record<string, unknown> | null;
  created_at?: string | null;
  mock?: boolean;
}

export interface VerificationMetricResult {
  metric_name: string;
  before_value: number | null;
  after_value: number | null;
  change_value: number | null;
  change_rate: number | null;
  improved: boolean | null;
}

export interface EffectVerificationResult {
  store_id: number;
  recommendation_id: string;
  recommendation_type: RecommendationType;
  effect_score: number | null;
  verdict: "EFFECTIVE" | "PARTIALLY_EFFECTIVE" | "NOT_EFFECTIVE" | "INCONCLUSIVE" | "INEFFECTIVE";
  metric_results: VerificationMetricResult[] | null;
  summary: string | null;
  verified_date?: string;
}
