export type PipelineStatus = "후보" | "연락 예정" | "접촉" | "미팅" | "전환" | "보류" | "제외";

export interface SalesTargetBusiness {
  id: string;
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
