import axios from 'axios';
import { getAccessToken } from '../../../../features/auth/model/authSession';
import { API_BASE_URL } from '../../../../shared/config/runtimeEnv';

const BASE_URL = API_BASE_URL;

export interface Review { id: number; rating: number; content: string; reviewedDate?: string; isAnalyzed?: boolean; }
export interface AspectStat { aspect: string; positive: number; neutral: number; negative: number; }
export interface ReviewKeywords { reviewKeywordId: number; aspect: string; sentiment: string; keyword: string; count: number; matchedReviewIds: number[]; changeRate: number; analyzedAt: string; }
export interface ActionItem { priority: 'HIGH' | 'MEDIUM' | 'LOW'; aspect: string; keyword: string; trendSummary: string; problemCause: string; actionPlan: string; expectedOutcome: string; executedAt: string | null; }
export interface Recommendations { recommendationId: number; storeId: number; executiveSummary: string; actionItems: ActionItem[]; createdAt: string; }
export interface MonthlyReportStatus { targetMonth: string; generated: boolean; }
export interface ReviewTrend { week: string; averageRating: number; negativeReviewCount: number; }
export interface TestReviewCreateRequest { rating: number; content: string; reviewedDate: string; }

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getStoreReviews = async (storeId: number) =>
  (await axios.get<Review[]>(`${BASE_URL}/api/v3/stores/${storeId}/reviews`, { headers: authHeaders() })).data;

export const createTestReview = async (storeId: number, request: TestReviewCreateRequest) =>
  (await axios.post<Review>(
    `${BASE_URL}/api/v3/stores/${storeId}/reviews/test`,
    request,
    { headers: authHeaders() },
  )).data;

export const createTestReviews = async (storeId: number, reviews: TestReviewCreateRequest[]) =>
  (await axios.post<Review[]>(
    `${BASE_URL}/api/v3/stores/${storeId}/reviews/test/batch`,
    { reviews },
    { headers: authHeaders() },
  )).data;

export const analyzeRequest = async (storeId: number) => {
  await axios.post(`${BASE_URL}/api/v3/stores/${storeId}/reviews/analysis`, {}, { headers: authHeaders() });
};

export const getAspectStat = async (storeId: number) =>
  (await axios.get<AspectStat[]>(`${BASE_URL}/api/v3/stores/${storeId}/aspect-stat`, { headers: authHeaders() })).data;

export const getMonthlyReportStatus = async (storeId: number, targetMonth: string) =>
  (await axios.get<MonthlyReportStatus>(`${BASE_URL}/api/v3/stores/${storeId}/reviews/monthly-report/status`, {
    params: { targetMonth }, headers: authHeaders(),
  })).data;

export const generateMonthlyReport = async (storeId: number, targetMonth: string) => {
  await axios.post(`${BASE_URL}/api/v3/stores/${storeId}/reviews/monthly-report`, {}, {
    params: { targetMonth }, headers: authHeaders(),
  });
};

export const getReviewKeywords = async (storeId: number) =>
  (await axios.get<ReviewKeywords[]>(`${BASE_URL}/api/v3/stores/${storeId}/reviews/keywords`, { headers: authHeaders() })).data;

export const getRecommendations = async (storeId: number) =>
  (await axios.get<Recommendations>(`${BASE_URL}/api/v3/stores/${storeId}/recommendations/latest`, { headers: authHeaders() })).data;

export const patchCompleteActionItem = async (recommendationId: number, keyword: string) => {
  await axios.patch(
    `${BASE_URL}/api/v3/stores/recommendations/${recommendationId}/action-items/complete`,
    null,
    { params: { keyword }, headers: authHeaders() },
  );
};

export const getReviewTrend = async (storeId: number) =>
  (await axios.get<ReviewTrend[]>(
    `${BASE_URL}/api/v3/stores/${storeId}/reviews/trend`,
    { headers: authHeaders() },
  )).data;
