import type { UserRole } from "../../../entities/user/user.types";
import { apiRequest } from "../../../shared/api/apiClient";

export interface InvitationResponse {
  id: number;
  email: string;
  targetRole: UserRole;
  expiresAt: string;
  temporaryPassword: string;
}

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface InvitationSummary {
  id: number;
  email: string;
  targetRole: UserRole;
  invitedByUserId: number;
  invitedByName: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
}

export interface InvitationPayload {
  email: string;
  currentPassword: string;
}

function invite(path: string, payload: InvitationPayload) {
  return apiRequest<InvitationResponse>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function inviteAdmin(payload: InvitationPayload) {
  return invite("/api/iam/invitation/admin", payload);
}

export function inviteStoreOwner(payload: InvitationPayload) {
  return invite("/api/iam/invitation/store-owner", payload);
}

export function getInvitations() {
  return apiRequest<InvitationSummary[]>("/api/iam/invitation");
}

export function revokeInvitation(invitationId: number, currentPassword: string) {
  return apiRequest<InvitationSummary>(
    `/api/iam/invitation/${invitationId}/revoke`,
    {
      method: "PATCH",
      body: JSON.stringify({ currentPassword }),
    },
  );
}
