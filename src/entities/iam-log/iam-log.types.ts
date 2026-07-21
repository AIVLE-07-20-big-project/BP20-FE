export interface IAMLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  result: "성공" | "실패" | "거부";
  ipSummary: string;
  detail: string;
}
