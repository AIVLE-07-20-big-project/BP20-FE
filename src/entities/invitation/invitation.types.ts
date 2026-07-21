import type { UserRole } from "../user/user.types";

export type InvitationStatus = "대기" | "수락" | "만료" | "취소";

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}
