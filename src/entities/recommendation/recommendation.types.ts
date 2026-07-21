export type ActionStatus = "추천됨" | "실행 예정" | "측정 중" | "효과 확인" | "보류";

export interface AIRecommendation {
  id: string;
  category: "매출" | "재고" | "리뷰" | "고객" | "원가";
  title: string;
  problem: string;
  expectedImpact: string;
  expectedValue: string;
  effort: "낮음" | "중간" | "높음";
  confidence: number;
  evidenceCount: number;
  deadline: string;
  status: ActionStatus;
  priority: "P1" | "P2" | "P3";
  evidence: string[];
  assumptions: string[];
  predictionRange: string;
  measurementDays: number;
  executedAt?: string;
  completedAt?: string;
  verifiedResult?: string;
}
