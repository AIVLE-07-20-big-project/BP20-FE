import { apiRequest } from "../../../shared/api/apiClient";

export type IamLogAction =
  | "SUPER_ADMIN_CREATED"
  | "ADMIN_INVITATION_CREATED"
  | "ADMIN_INVITATION_ACCEPTED"
  | "ADMIN_INVITATION_REVOKED"
  | "STORE_OWNER_INVITATION_CREATED"
  | "STORE_OWNER_INVITATION_ACCEPTED"
  | "STORE_OWNER_INVITATION_REVOKED"
  | "ADMIN_DEACTIVATED"
  | "ADMIN_ACTIVATED"
  | "ADMIN_PERSONAL_DATA_REVEALED"
  | "ADMIN_PERSONAL_DATA_REVEAL_FAILED"
  | "STORE_OWNER_DEACTIVATED"
  | "STORE_OWNER_ACTIVATED"
  | "STORE_OWNER_PERSONAL_DATA_REVEALED"
  | "STORE_OWNER_PERSONAL_DATA_REVEAL_FAILED";

export interface IamLog {
  id: number;
  actorUserId: number | null;
  action: IamLogAction;
  targetUserId: number | null;
  targetEmail: string | null;
  sourceIp: string;
  createdAt: string;
}

export function getIamLogs() {
  return apiRequest<IamLog[]>("/api/admin/iam/logs");
}
