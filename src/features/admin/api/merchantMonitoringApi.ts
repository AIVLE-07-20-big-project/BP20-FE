import { apiRequest } from "../../../shared/api/apiClient";

interface MerchantMonitoringApiItem {
  storeId: number;
  storeName: string;
  category: string;
  address: string;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  ownerStatus: "ACTIVE" | "INACTIVE";
  createdAt: string;
  analysisCount: number;
  recommendationRunCount: number;
  executedRecommendationCount: number;
  aiActive: boolean;
}

interface MerchantMonitoringApiResponse {
  totalMerchants: number;
  activeMerchants: number;
  aiActiveMerchants: number;
  merchants: MerchantMonitoringApiItem[];
}

export interface MerchantMonitoringItem {
  id: number;
  name: string;
  owner: string;
  address: string;
  category: string;
  aiActive: boolean;
  analysisCount: number;
  executionRate: number;
  verifiedRecommendations: number | null;
}

export async function getMerchantMonitoring() {
  const response = await apiRequest<MerchantMonitoringApiResponse>("/api/admin/merchants/monitoring");
  const merchants = Array.isArray(response?.merchants) ? response.merchants : [];

  return {
    ...response,
    merchants: merchants.map((merchant): MerchantMonitoringItem => ({
      id: merchant.storeId,
      name: merchant.storeName,
      owner: merchant.ownerName,
      address: merchant.address,
      category: merchant.category,
      aiActive: merchant.aiActive,
      analysisCount: merchant.analysisCount,
      executionRate: merchant.recommendationRunCount > 0
        ? (merchant.executedRecommendationCount / merchant.recommendationRunCount) * 100
        : 0,
      // 현재 매장 모니터링 API에는 매장별 효과 검증 건수가 포함되지 않습니다.
      verifiedRecommendations: null,
    })),
  };
}
