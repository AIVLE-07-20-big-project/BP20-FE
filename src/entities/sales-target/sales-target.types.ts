export type PipelineStatus = "후보" | "연락 예정" | "접촉" | "미팅" | "전환" | "보류" | "제외";

export interface SalesTargetBusiness {
  id: number;
  name: string;
  industry: string;
  region: string;
  score: number;
  growthScore: number;
  trafficScore: number;
  reviewScore: number;
  similarityScore: number;
  proposition: string;
  pipelineStatus: PipelineStatus;
}

// AI 서버(app/sales_target/graph.py) LangGraph 배치 실행 1건.
// 승인 대기 중(pendingApproval이 not null)일 때는 아직 세일즈 피칭 문구가 없다 — AI가
// generate_pitch 노드를 승인 이후에만 돌리기 때문(반려될 배치에 LLM 비용을 안 쓰기 위함).
export interface SalesTargetBatchCandidatePreview {
  businessName: string;
  industry: string | null;
  region: string;
  growthScore: number | null;
  trafficScore: number | null;
  reviewScore: number | null;
  similarityScore: number | null;
  totalScore: number | null;
  // 승인 대기 중(pendingApproval)일 때는 항상 null — AI가 generate_pitch를 승인 이후에만
  // 돌리기 때문. 승인/반려가 끝난 배치를 배치 이력에서 다시 조회할 때(finalCandidates)는
  // 승인된 배치라면 세일즈 피칭 문구가, 반려된 배치라면 null이 들어온다.
  proposition: string | null;
}

// 구현 4 — critic_agent(배치 검수 에이전트)가 사람이 검수하기 전에 먼저 훑어보고 남긴
// 요약/주목 후보. agentSummary는 critic_agent가 도구 호출을 못 끝냈거나 예외가 나면
// 빈 문자열이 아니라 폴백 문구("자동 요약 생성 실패" 등)로 채워져서 넘어온다 — FE는
// 그 값 그대로 보여주면 된다(별도 빈 값 처리 불필요).
export interface SalesTargetFlaggedCandidate {
  businessName: string;
  reason: string;
}

export interface SalesTargetBatchPendingApproval {
  candidates: SalesTargetBatchCandidatePreview[];
  candidateCount: number;
  warnings: string[];
  agentSummary: string;
  flaggedCandidates: SalesTargetFlaggedCandidate[];
}

export interface SalesTargetBatchRun {
  threadId: string;
  status: string;
  pendingApproval: SalesTargetBatchPendingApproval | null;
  pushResult: { created: number; updated: number } | null;
  // 4단계(운영 정리 정책) — 관리자가 staleDays일 이상 방치한 배치를 BE가 대신 반려했을 때 true.
  // AI 쪽엔 이 구분이 없어(같은 반려 API를 호출) BE(SalesTargetBatchRun.autoRejected)가 별도로
  // 추적하는 값이다. "관리자가 직접 반려함"과 구분해서 보여주는 용도로만 쓴다.
  autoRejected: boolean;
  // 배치 시작 시각(BE BaseTimeEntity.createdAt, ISO 문자열). 배치 이력 목록 정렬/표시용.
  createdAt: string | null;
  // AI 그래프 state의 최상위 "ranked" 필드 그대로 — 승인 대기 중이든 승인/반려가 끝났든
  // 항상 채워져 있다(BE가 배치 이력을 자기 DB에 캐시된 마지막 AI 응답으로 내려주기 때문에,
  // list 응답에도 이미 포함돼 있다). 승인된 배치라면 각 항목의 proposition(피칭 문구)도
  // generate_pitch가 채워둔 값이 그대로 들어있다. 배치 이력 클릭 시 getSalesTargetBatch로
  // 다시 조회하면 BE가 AI에 최신 상태를 재확인해서 캐시를 갱신해준다.
  finalCandidates: SalesTargetBatchCandidatePreview[] | null;
}
