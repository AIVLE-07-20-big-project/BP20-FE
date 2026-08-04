import type { RecommendationType } from "./effect-verification.types";

export interface EffectVerificationStoreSummary {
  store_id: number;
  verified_count: number;
  average_effect_score: number;
}

export interface EffectVerificationTypeSummary {
  recommendation_type: RecommendationType;
  verified_count: number;
  average_effect_score: number;
}

export interface EffectVerificationRecentResult {
  recommendation_id: string;
  store_id: number;
  recommendation_type: RecommendationType;
  effect_score: number;
  verdict: string;
  verified_date: string;
}

export interface EffectVerificationRoiSummary {
  total_stores: number;
  ai_active_stores: number;
  recommendation_runs: number;
  executed_recommendations: number;
  execution_rate: number;
  total_verified: number;
  average_effect_score: number;
  effective_count: number;
  inconclusive_count: number;
  ineffective_count: number;
  store_summaries: EffectVerificationStoreSummary[];
  type_summaries: EffectVerificationTypeSummary[];
  recent_results: EffectVerificationRecentResult[];
}
