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
  before_value: number | null;
  after_value: number | null;
  change_value: number | null;
  change_rate: number | null;
  improved: boolean | null;
}

export interface EffectVerificationResult {
  store_id: number;
  recommendation_id: number;
  recommendation_type: RecommendationType;
  effect_score: number | null;
  verdict: "EFFECTIVE" | "PARTIALLY_EFFECTIVE" | "NOT_EFFECTIVE" | "INCONCLUSIVE" | "INEFFECTIVE";
  metric_results: VerificationMetricResult[] | null;
  summary: string | null;
  verified_date?: string;
}
