export type RecommendationType = "SALES" | "REVIEW";

export type VerificationStatus = "COLLECTING" | "READY" | "VERIFIED" | "FAILED";

export interface VerificationExecution {
  store_id: number;
  recommendation_id: number;
  recommendation_type: RecommendationType;
  status: VerificationStatus;
  executed_at: string;
  verification_due_at: string;
  verified_at: string | null;
  failure_reason: string | null;
  attempt_count: number;
  last_attempt_at: string | null;
}

export interface VerificationMetricResult {
  metric_name: string;
  before_value: number;
  after_value: number;
  change_value: number;
  change_rate: number | null;
  improved: boolean;
}

export interface EffectVerificationResult {
  store_id: number;
  recommendation_id: number;
  recommendation_type: RecommendationType;
  effect_score: number;
  verdict: "EFFECTIVE" | "PARTIALLY_EFFECTIVE" | "NOT_EFFECTIVE";
  metric_results: VerificationMetricResult[];
  summary: string;
  verified_date?: string;
}
