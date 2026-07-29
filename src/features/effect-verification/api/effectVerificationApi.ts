import type {
  EffectVerificationResult,
  RegisterMockThreadExecutionInput,
  RegisterVerificationExecutionInput,
  StartRecommendationExecutionInput,
  VerificationCandidateRecommendation,
  VerificationExecution,
  VerificationStatus,
} from "../../../entities/effect-verification/effect-verification.types";
import { getAccessToken } from "../../../shared/api/apiClient";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

export class EffectVerificationApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "EffectVerificationApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getAccessToken()
    ?? window.sessionStorage.getItem("bp20:ai-access-token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as
      | { message?: string; detail?: string; error?: { message?: string } }
      | null;
    const message = payload?.message
      ?? payload?.detail
      ?? payload?.error?.message
      ?? `요청을 처리하지 못했습니다. (${response.status})`;
    throw new EffectVerificationApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function getVerificationExecution(
  recommendationId: string,
): Promise<VerificationExecution | null> {
  try {
    return await request<VerificationExecution>(
      `/api/effect-verifications/executions/${encodeURIComponent(recommendationId)}`,
    );
  } catch (error) {
    if (error instanceof EffectVerificationApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function getVerificationHistory(
  storeId: number,
  status?: VerificationStatus,
) {
  const query = new URLSearchParams({ store_id: String(storeId) });
  if (status) query.set("status", status);

  return request<VerificationExecution[]>(
    `/api/effect-verifications/executions?${query.toString()}`,
  );
}

export function registerVerificationExecution(
  input: RegisterVerificationExecutionInput,
) {
  return request<VerificationExecution>(
    "/api/effect-verifications/executions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function getVerificationCandidates() {
  const actualCandidates = await request<{
    data: VerificationCandidateRecommendation[];
  }>("/api/ai/recommendations")
    .then((response) => response.data)
    .catch((error: unknown) => {
      if (
        error instanceof EffectVerificationApiError
        && (error.status === 401 || error.status === 403)
      ) {
        return [];
      }
      throw error;
    });

  const mockCandidates = await request<VerificationCandidateRecommendation[]>(
    "/api/mock/effect-verifications/executions/candidates",
  ).catch((error: unknown) => {
    if (
      error instanceof EffectVerificationApiError
      && (error.status === 401 || error.status === 403 || error.status === 404)
    ) {
      return [];
    }
    throw error;
  });

  return [...actualCandidates, ...mockCandidates];
}

export function startRecommendationExecution(input: StartRecommendationExecutionInput) {
  return request<VerificationExecution>(
    "/api/effect-verifications/executions/start",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function linkCampaignDecision(threadId: string, decisionId: string) {
  return request<VerificationExecution>(
    `/api/effect-verifications/executions/by-thread/${encodeURIComponent(threadId)}/decision`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision_id: decisionId }),
    },
  );
}

export function registerMockThreadExecution(
  threadId: string,
  input: RegisterMockThreadExecutionInput,
) {
  return request<VerificationExecution>(
    `/api/mock/effect-verifications/executions/by-thread/${encodeURIComponent(threadId)}/register-auto`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function registerMockExecution(recommendationId: string) {
  return request<VerificationExecution>(
    `/api/mock/effect-verifications/executions/${encodeURIComponent(recommendationId)}/register-auto`,
    { method: "POST" },
  );
}

export function completeMockVerification(recommendationId: string) {
  const identifierPath = recommendationId.includes("-")
    ? `by-thread/${encodeURIComponent(recommendationId)}`
    : encodeURIComponent(recommendationId);
  return request<EffectVerificationResult>(
    `/api/mock/effect-verifications/executions/${identifierPath}/complete-auto`,
    { method: "POST" },
  );
}

export function retryEffectVerification(recommendationId: string) {
  return request<VerificationExecution>(
    `/api/effect-verifications/executions/${encodeURIComponent(recommendationId)}/retry`,
    { method: "POST" },
  );
}

export function resetMockVerificationData() {
  return request<{
    deletedExecutions: number;
    deletedResults: number;
    deletedStrategyWeights: number;
  }>(
    "/api/mock/effect-verifications/executions/reset",
    { method: "POST" },
  );
}

export async function getVerificationResult(
  recommendationId: string,
): Promise<EffectVerificationResult | null> {
  try {
    return await request<EffectVerificationResult>(
      `/api/effect-verifications/recommendations/${encodeURIComponent(recommendationId)}`,
    );
  } catch (error) {
    if (error instanceof EffectVerificationApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
