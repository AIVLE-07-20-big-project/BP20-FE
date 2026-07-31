// BE(SalesTargetController/InternalSalesTargetIngestController)와 통신한다.
// BE의 PipelineStatus enum(영문: CANDIDATE 등)과 FE의 PipelineStatus 타입(한글 라벨)이
// 서로 다른 표현이라 이 파일 안에서만 양방향 변환한다 — entities 레이어의 타입은
// UI 표시용 한글 그대로 유지한다(이미 여러 곳에서 한글 키로 스타일/문구 매핑을 하고 있어서).
import { apiRequest } from "../../../shared/api/apiClient";
import type { PipelineStatus, SalesTargetBusiness } from "../../../entities/sales-target/sales-target.types";

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
