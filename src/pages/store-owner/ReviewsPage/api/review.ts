import { apiRequest } from '@/shared/api/apiClient';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export interface Review {
    id: number;
    rating: number;
    content: string;
    reviewedDate?: string;
    isAnalyzed?: boolean;
}

export interface AspectStat {
    aspect: string;
    positive: number;
    neutral: number;
    negative: number;
}

export interface ReviewKeywords {
    reviewKeywordId: number;
    aspect: string;
    sentiment: string;
    keyword: string;
    count: number;
    matchedReviewIds: number[];
    changeRate: number;
    analyzedAt: string;
}

export interface ActionItem {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  aspect: string;
  keyword: string;
  trendSummary: string;
  problemCause: string;
  actionPlan: string;
  expectedOutcome: string;
  executedAt: string | null;
}

export interface Recommendations {
    recommendationId: number;
    storeId: number;
    executiveSummary: string;
    actionItems: ActionItem[];
    createdAt: string;
}

export interface MonthlyReportStatus {
  targetMonth: string;
  generated: boolean;
}

export const getStoreReviews = async (storeId: number): Promise<Review[]> => {
  return apiRequest<Review[]>(`/api/v3/stores/${storeId}/reviews`);
};

export const analyzeRequest = async (storeId: number): Promise<void> => {
  return apiRequest<void>(`/api/v3/stores/${storeId}/reviews/analysis`, {
    method: 'POST',
  });
};

export const getAspectStat = async (storeId: number): Promise<AspectStat[]> => {
  return apiRequest<AspectStat[]>(`/api/v3/stores/${storeId}/aspect-stat`);
};

export const getMonthlyReportStatus = async (storeId: number, targetMonth: string): Promise<MonthlyReportStatus> => {
  return apiRequest<MonthlyReportStatus>(
    `/api/v3/stores/${storeId}/reviews/monthly-report/status?${new URLSearchParams({ targetMonth })}`,
  );
};

export const generateMonthlyReport = async (storeId: number, targetMonth: string): Promise<void> => {
  return apiRequest<void>(
    `/api/v3/stores/${storeId}/reviews/monthly-report?${new URLSearchParams({ targetMonth })}`,
    { method: 'POST' },
  );
};

export const getReviewKeywords = async (storeId: number): Promise<ReviewKeywords[]> => {
  return apiRequest<ReviewKeywords[]>(`/api/v3/stores/${storeId}/reviews/keywords`);
};

export const getRecommendations = async (storeId: number): Promise<Recommendations> => {
  return apiRequest<Recommendations>(`/api/v3/stores/${storeId}/recommendations/latest`);
};

export const patchCompleteActionItem = async (
  recommendationId: number,
  keyword: string
): Promise<void> => {
  const queryParam = new URLSearchParams({ keyword }).toString();
  return apiRequest<void>(
    `/api/v3/stores/recommendations/${recommendationId}/action-items/complete?${queryParam}`,
    {
      method: 'PATCH',
    }
  );
}
