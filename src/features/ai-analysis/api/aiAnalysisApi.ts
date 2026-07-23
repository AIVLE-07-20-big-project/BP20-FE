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
  form.append("trdar_cd", input.trdarCd);
  form.append("svc_induty_cd", input.svcIndutyCd);
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

export function getRecommendations(accessToken: string) {
  return apiRequest<AiRecommendationRun[]>(
    "/api/ai/recommendations",
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
