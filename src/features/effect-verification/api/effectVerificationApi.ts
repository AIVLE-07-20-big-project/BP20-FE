import type {
  EffectVerificationResult,
  VerificationExecution,
} from "../../../entities/effect-verification/effect-verification.types";

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
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
  recommendationId: number,
): Promise<VerificationExecution | null> {
  try {
    return await request<VerificationExecution>(
      `/api/effect-verifications/executions/${recommendationId}`,
    );
  } catch (error) {
    if (error instanceof EffectVerificationApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function registerMockExecution(recommendationId: number) {
  return request<VerificationExecution>(
    `/api/mock/effect-verifications/executions/${recommendationId}/register-auto`,
    { method: "POST" },
  );
}

export function completeMockVerification(recommendationId: number) {
  return request<EffectVerificationResult>(
    `/api/mock/effect-verifications/executions/${recommendationId}/complete-auto`,
    { method: "POST" },
  );
}

export async function getVerificationResult(
  recommendationId: number,
): Promise<EffectVerificationResult | null> {
  try {
    return await request<EffectVerificationResult>(
      `/api/effect-verifications/recommendations/${recommendationId}`,
    );
  } catch (error) {
    if (error instanceof EffectVerificationApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
