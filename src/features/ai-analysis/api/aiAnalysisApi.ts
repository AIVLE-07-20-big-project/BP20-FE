import type {
  AiAnalysisResult,
  AiRecommendationDecision,
  AiRecommendationRun,
  CreateAnalysisInput,
} from "../../../entities/ai-analysis/ai-analysis.types";
import { apiRequest } from "../../../shared/api/http";

export function createAnalysis(input: CreateAnalysisInput, accessToken: string) {
  const form = new FormData();
  form.append("file", input.file);
  if (input.trdarCd) form.append("trdar_cd", input.trdarCd);
  if (input.svcIndutyCd) form.append("svc_induty_cd", input.svcIndutyCd);
  if (input.yyquCd !== undefined) form.append("yyqu_cd", String(input.yyquCd));
  if (input.storeId) form.append("store_id", input.storeId);

  return apiRequest<AiAnalysisResult>("/api/ai/analyses", {
    method: "POST",
    body: form,
  }, accessToken);
}

export function createRecommendation(analysisId: string, accessToken: string) {
  return apiRequest<AiRecommendationRun>(
    `/api/ai/analyses/${encodeURIComponent(analysisId)}/recommendations`,
    { method: "POST" },
    accessToken,
  );
}

export function getRecommendations(accessToken: string, storeId?: string) {
  const query = storeId ? `?store_id=${encodeURIComponent(storeId)}` : "";
  return apiRequest<AiRecommendationRun[]>(
    `/api/ai/recommendations${query}`,
    { method: "GET" },
    accessToken,
  );
}

export function resumeRecommendation(
  threadId: string,
  decision: AiRecommendationDecision,
  accessToken: string,
) {
  return apiRequest<AiRecommendationRun>(
    `/api/ai/agent-runs/${encodeURIComponent(threadId)}/resume`,
    { method: "POST", body: JSON.stringify({ decision }) },
    accessToken,
  );
}
