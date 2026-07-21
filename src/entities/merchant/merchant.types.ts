export type RiskLevel = "critical" | "high" | "watch" | "medium" | "low" | "stable";
export type ConnectionStatus = "connected" | "delayed" | "disconnected" | "error";

export interface Merchant {
  id: string;
  name: string;
  owner: string;
  region: string;
  industry: string;
  posStatus: ConnectionStatus;
  aiStatus: "active" | "inactive" | "trial";
  riskLevel: RiskLevel;
  salesChange4w: number;
  reportOpenRate: number;
  executionRate: number;
  subscription: string;
  assignedManager: string;
  joinedAt: string;
  phone: string;
  businessNumber: string;
}
