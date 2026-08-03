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

const bearerToken = localStorage.getItem('accessToken');

export const getStoreReviews = async (storeId: number = 1) => {
    const response = await axios.get<Review[]>(
        `${BASE_URL}/api/v3/stores/${storeId}/reviews`,
        {
            headers: {
                Authorization: bearerToken,
            },
        }
    );
    return response.data;
};

export const analyzeRequest = async (storeId: number = 1) => {
    await axios.post(
        `${BASE_URL}/api/v3/stores/${storeId}/reviews/analysis`,
        {},
        {
            headers: {
                Authorization: bearerToken,
            },
        }
    );
}

export const getAspectStat = async (storeId: number = 1) => {
    const response = await axios.get<AspectStat[]>(
        `${BASE_URL}/api/v3/stores/${storeId}/aspect-stat`,
        {
            headers: {
                Authorization: bearerToken,
            },
        }
    );

    return response.data;
}

export const getReviewKeywords = async (storeId: number = 1) => {
    const response = await axios.get<ReviewKeywords[]>(
        `${BASE_URL}/api/v3/stores/${storeId}/reviews/keywords`,
        {
            headers: {
                Authorization: bearerToken,
            },
        }
    );

    return response.data;
}

export const getRecommendations = async (storeId: number = 1) => {
    const response = await axios.get<Recommendations>(
        `${BASE_URL}/api/v3/stores/${storeId}/recommendations/latest`,
        {
            headers: {
                Authorization: bearerToken,
            },
        }
    );

    return response.data;
}

export const patchCompleteActionItem = async (recommendationId: number, keyword: string) => {
  const response = await axios.patch(
    `${BASE_URL}/api/v3/stores/recommendations/${recommendationId}/action-items/complete`,
    null,
    {
      params: { keyword },
      headers: {
        Authorization: bearerToken,
      },
    }
  );
  return response.data;
};