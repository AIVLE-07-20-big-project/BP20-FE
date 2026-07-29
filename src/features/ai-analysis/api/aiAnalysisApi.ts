import type {
  AiAnalysisJob,
  AiAnalysisResult,
  AiRecommendationDecision,
  AiRecommendationRun,
  CreateAnalysisInput,
} from "../../../entities/ai-analysis/ai-analysis.types";
import { apiRequest } from "../../../shared/api/apiClient";

// AI 서비스가 202 + job_id로 응답한다(비동기 분석) — 완료 여부는 getAnalysisJobStatus로 폴링한다.
export function createAnalysis(input: CreateAnalysisInput) {
  const form = new FormData();
  form.append("file", input.file);
  if (input.trdarCd) form.append("trdar_cd", input.trdarCd);
  if (input.svcIndutyCd) form.append("svc_induty_cd", input.svcIndutyCd);
  if (input.yyquCd !== undefined) form.append("yyqu_cd", String(input.yyquCd));
  if (input.storeId) form.append("store_id", input.storeId);

  return apiRequest<AiAnalysisJob>("/api/ai/analyses", {
    method: "POST",
    body: form,
  });
}

export function getAnalysisJobStatus(jobId: string) {
  return apiRequest<AiAnalysisJob>(`/api/ai/jobs/${encodeURIComponent(jobId)}`, { method: "GET" });
}

export function getAnalysis(analysisId: string) {
  return apiRequest<AiAnalysisResult>(`/api/ai/analyses/${encodeURIComponent(analysisId)}`, { method: "GET" });
}

// completed/failed까지 일정 간격으로 폴링한다. intervalMs·timeoutMs로 속도·상한을 조절하고,
// onUpdate로 매 폴링마다의 중간 상태(queued/running)를 호출부에 알려 진행 표시에 쓸 수 있게 한다.
export async function pollAnalysisJob(
  jobId: string,
  {
    intervalMs = 2000,
    timeoutMs = 120000,
    onUpdate,
  }: { intervalMs?: number; timeoutMs?: number; onUpdate?: (job: AiAnalysisJob) => void } = {},
): Promise<AiAnalysisJob> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const job = await getAnalysisJobStatus(jobId);
    onUpdate?.(job);
    if (job.status === "completed" || job.status === "failed") return job;
    if (Date.now() >= deadline) {
      throw new Error("분석 완료를 기다리는 시간이 초과되었습니다. 잠시 후 다시 확인해 주세요.");
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export function createRecommendation(analysisId: string) {
  return apiRequest<AiRecommendationRun>(
    `/api/ai/analyses/${encodeURIComponent(analysisId)}/recommendations`,
    { method: "POST" },
  );
}

export function getRecommendations(storeId?: string) {
  const query = storeId ? `?store_id=${encodeURIComponent(storeId)}` : "";
  return apiRequest<AiRecommendationRun[]>(`/api/ai/recommendations${query}`, { method: "GET" });
}

export function resumeRecommendation(
  threadId: string,
  decision: AiRecommendationDecision,
  selectedAction?: string,
) {
  return apiRequest<AiRecommendationRun>(
    `/api/ai/agent-runs/${encodeURIComponent(threadId)}/resume`,
    {
      method: "POST",
      body: JSON.stringify(
        // Spring Boot 현재 프록시는 modification_plan으로 FastAPI에 전달한다.
        // FE에서는 의미를 selectedAction으로 관리하되 기존 BE와 호환되는 키를 사용한다.
        selectedAction ? { decision, modification_plan: selectedAction } : { decision },
      ),
    },
  );
}
