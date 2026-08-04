import { apiRequest } from "../../../shared/api/apiClient";

export interface MerchantMonitoringItem {
  id: number;
  name: string;
  owner: string;
  address: string;
  category: string;
  aiActive: boolean;
  analysisCount: number;
  latestAnalysisAt: string | null;
  recommendationRuns: number;
  executedRecommendations: number;
  executionRate: number;
  verifiedRecommendations: number;
  averageEffectScore: number | null;
  status: "AI_INACTIVE" | "VERIFIED" | "RECOMMENDED" | "ANALYZED";
}

export function getMerchantMonitoring() {
  return apiRequest<{ merchants: MerchantMonitoringItem[] }>("/api/admin/merchants/monitoring");
}
