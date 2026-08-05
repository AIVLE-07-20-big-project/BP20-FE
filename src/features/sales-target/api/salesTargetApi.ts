// BE(SalesTargetController/InternalSalesTargetIngestController)와 통신한다.
// BE의 PipelineStatus enum(영문: CANDIDATE 등)과 FE의 PipelineStatus 타입(한글 라벨)이
// 서로 다른 표현이라 이 파일 안에서만 양방향 변환한다 — entities 레이어의 타입은
// UI 표시용 한글 그대로 유지한다(이미 여러 곳에서 한글 키로 스타일/문구 매핑을 하고 있어서).
import { apiRequest } from "../../../shared/api/apiClient";
import type {
  PipelineStatus,
  SalesTargetBatchCandidatePreview,
  SalesTargetBatchRun,
  SalesTargetBusiness,
  SalesTargetFlaggedCandidate,
} from "../../../entities/sales-target/sales-target.types";

const BACKEND_TO_FE_STATUS: Record<string, PipelineStatus> = {
  CANDIDATE: "후보",
  CONTACT_PLANNED: "연락 예정",
  CONTACTED: "접촉",
  MEETING: "미팅",
  CONVERTED: "전환",
  HOLD: "보류",
  EXCLUDED: "제외",
};

const FE_TO_BACKEND_STATUS: Record<PipelineStatus, string> = {
  "후보": "CANDIDATE",
  "연락 예정": "CONTACT_PLANNED",
  "접촉": "CONTACTED",
  "미팅": "MEETING",
  "전환": "CONVERTED",
  "보류": "HOLD",
  "제외": "EXCLUDED",
};

// BE SalesTargetCandidateResponse와 1:1 매핑.
// growthScore 등은 AI가 아직 데이터를 못 채운 상권(공공데이터 갱신 지연 등)의 경우 BE에서
// null로 올 수 있어 옵셔널로 잡는다.
interface SalesTargetCandidateResponseDto {
  id: number;
  name: string;
  industry: string | null;
  region: string;
  score: number;
  growthScore: number | null;
  trafficScore: number | null;
  reviewScore: number | null;
  similarityScore: number | null;
  proposition: string | null;
  pipelineStatus: string;
}

function toDomain(dto: SalesTargetCandidateResponseDto): SalesTargetBusiness {
  return {
    id: dto.id,
    name: dto.name,
    industry: dto.industry ?? "미분류",
    region: dto.region,
    score: dto.score,
    growthScore: dto.growthScore ?? 0,
    trafficScore: dto.trafficScore ?? 0,
    reviewScore: dto.reviewScore ?? 0,
    similarityScore: dto.similarityScore ?? 0,
    proposition: dto.proposition ?? "추천 사유가 아직 생성되지 않았습니다.",
    pipelineStatus: BACKEND_TO_FE_STATUS[dto.pipelineStatus] ?? "후보",
  };
}

export async function fetchSalesTargets(): Promise<SalesTargetBusiness[]> {
  const dtos = await apiRequest<SalesTargetCandidateResponseDto[]>("/api/admin/sales-targets");
  return dtos.map(toDomain);
}

// SQL 없이 관리자가 클릭 한 번으로 테스트/디버깅 중 쌓인 후보를 전부 지울 때 쓴다.
// 배치 이력은 건드리지 않는다. 반환값은 삭제된 건수.
export async function deleteAllSalesTargets(): Promise<number> {
  return apiRequest<number>("/api/admin/sales-targets", { method: "DELETE" });
}

export async function updateSalesTargetPipelineStatus(
  id: number,
  status: PipelineStatus,
): Promise<SalesTargetBusiness> {
  const dto = await apiRequest<SalesTargetCandidateResponseDto>(
    `/api/admin/sales-targets/${id}/pipeline-status`,
    {
      method: "PATCH",
      body: JSON.stringify({ pipelineStatus: FE_TO_BACKEND_STATUS[status] }),
    },
  );
  return toDomain(dto);
}

// ── 배치 실행(AI Agent 전환 3단계) ──────────────────────────────────────────
// BE(SalesTargetBatchController)가 AI 서버(app/sales_target/graph.py)의 응답을 그대로
// 통과시켜 주기 때문에, 여기서 받는 원본 JSON은 AI 쪽 한글 키("상태", "대기중_승인",
// "후보_리스트", "후보_수", "주의사항")를 그대로 갖고 있다. 이 파일 안에서만 FE 도메인 타입
// (entities/sales-target)의 camelCase 구조로 변환한다.
interface SalesTargetBatchCandidateRawDto {
  bizesNm?: string;
  businessName?: string;
  indsLclsNm?: string | null;
  rdnmAdr?: string;
  address?: string;
  growth_score?: number | null;
  traffic_score?: number | null;
  review_score?: number | null;
  similarity_score?: number | null;
  final_score?: number | null;
  // generate_pitch가 승인 이후에만 채운다(app/sales_target/graph.py) — 승인 대기 중인
  // "후보_리스트"에는 이 키 자체가 없고, 승인/반려가 끝난 뒤의 최상위 "ranked"에만 있을 수 있다.
  sales_pitch?: string | null;
}

// 구현 4 — critic_agent(배치 검수 에이전트)가 남긴 요약/주목 후보. graph.py의 _review()가
// interrupt payload에 "에이전트_요약"(문자열)/"주목_후보"(bizesNm/reason 목록)로 실어 보낸다.
interface SalesTargetFlaggedCandidateRawDto {
  bizesNm?: string;
  reason?: string;
}

interface SalesTargetBatchResponseDto {
  thread_id?: string;
  "상태"?: string;
  "대기중_승인"?: {
    "후보_리스트"?: SalesTargetBatchCandidateRawDto[];
    "후보_수"?: number;
    "주의사항"?: string[];
    "에이전트_요약"?: string;
    "주목_후보"?: SalesTargetFlaggedCandidateRawDto[];
  } | null;
  // AI 그래프 state 최상위 필드(app/sales_target/graph.py의 SalesTargetState["ranked"]).
  // 승인 대기 중이든 승인/반려가 끝났든 항상 존재한다 — 배치 이력에서 "그때 추천된 업장이
  // 뭐였는지"를 다시 보여주는 용도로 쓴다(대기중_승인은 승인/반려 이후 null이 되기 때문에
  // 그것만으로는 재조회가 안 된다).
  ranked?: SalesTargetBatchCandidateRawDto[] | null;
  push_result?: { created: number; updated: number } | null;
  auto_rejected?: boolean;
  created_at?: string | null;
}

function toCandidatePreview(row: SalesTargetBatchCandidateRawDto): SalesTargetBatchCandidatePreview {
  return {
    businessName: row.bizesNm ?? row.businessName ?? "이름 미상",
    industry: row.indsLclsNm ?? null,
    region: row.rdnmAdr ?? row.address ?? "",
    growthScore: row.growth_score ?? null,
    trafficScore: row.traffic_score ?? null,
    reviewScore: row.review_score ?? null,
    similarityScore: row.similarity_score ?? null,
    totalScore: row.final_score ?? null,
    proposition: row.sales_pitch ?? null,
  };
}

function toFlaggedCandidate(row: SalesTargetFlaggedCandidateRawDto): SalesTargetFlaggedCandidate {
  return {
    businessName: row.bizesNm ?? "이름 미상",
    reason: row.reason ?? "",
  };
}

function toBatchDomain(dto: SalesTargetBatchResponseDto): SalesTargetBatchRun {
  const pending = dto["대기중_승인"];
  return {
    threadId: dto.thread_id ?? "",
    status: dto["상태"] ?? "",
    pendingApproval: pending
      ? {
          candidates: (pending["후보_리스트"] ?? []).map(toCandidatePreview),
          candidateCount: pending["후보_수"] ?? 0,
          warnings: pending["주의사항"] ?? [],
          agentSummary: pending["에이전트_요약"] ?? "",
          flaggedCandidates: (pending["주목_후보"] ?? []).map(toFlaggedCandidate),
        }
      : null,
    pushResult: dto.push_result ?? null,
    autoRejected: dto.auto_rejected ?? false,
    createdAt: dto.created_at ?? null,
    finalCandidates: dto.ranked ? dto.ranked.map(toCandidatePreview) : null,
  };
}

export async function startSalesTargetBatch(topN?: number): Promise<SalesTargetBatchRun> {
  const dto = await apiRequest<SalesTargetBatchResponseDto>("/api/admin/sales-targets/batches", {
    method: "POST",
    body: JSON.stringify({ topN: topN ?? null }),
  });
  return toBatchDomain(dto);
}

export async function getSalesTargetBatch(threadId: string): Promise<SalesTargetBatchRun> {
  const dto = await apiRequest<SalesTargetBatchResponseDto>(`/api/admin/sales-targets/batches/${threadId}`);
  return toBatchDomain(dto);
}

export async function approveSalesTargetBatch(threadId: string): Promise<SalesTargetBatchRun> {
  const dto = await apiRequest<SalesTargetBatchResponseDto>(
    `/api/admin/sales-targets/batches/${threadId}/approve`,
    { method: "POST" },
  );
  return toBatchDomain(dto);
}

export async function rejectSalesTargetBatch(threadId: string): Promise<SalesTargetBatchRun> {
  const dto = await apiRequest<SalesTargetBatchResponseDto>(
    `/api/admin/sales-targets/batches/${threadId}/reject`,
    { method: "POST" },
  );
  return toBatchDomain(dto);
}

export async function listSalesTargetBatches(): Promise<SalesTargetBatchRun[]> {
  const dtos = await apiRequest<SalesTargetBatchResponseDto[]>("/api/admin/sales-targets/batches");
  return dtos.map(toBatchDomain);
}

// 4단계(운영 정리 정책) — 평소엔 BE의 SalesTargetBatchCleanupScheduler가 매일 자동으로 실행하지만,
// 관리자가 기다리지 않고 즉시 정리하고 싶을 때 수동으로 트리거한다. 반환값은 이번 호출로 자동
// 반려된 thread_id 목록.
export async function cleanupStaleSalesTargetBatches(): Promise<string[]> {
  return apiRequest<string[]>("/api/admin/sales-targets/batches/cleanup", { method: "POST" });
}

// 배치 이력 로그 한 줄을 지운다. BE가 승인 대기 중인 배치는 409로 막는다(먼저 승인/반려 필요).
export async function deleteSalesTargetBatch(threadId: string): Promise<void> {
  await apiRequest<void>(`/api/admin/sales-targets/batches/${threadId}`, { method: "DELETE" });
}
