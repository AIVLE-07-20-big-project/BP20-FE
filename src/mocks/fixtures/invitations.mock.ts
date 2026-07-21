import type { Invitation } from "../../entities/invitation/invitation.types";

export const INVITATIONS: Invitation[] = [
  { id: "inv1", email: "newadmin@bp20.com", role: "ADMIN", invitedBy: "이서연", status: "대기", createdAt: "2025-07-20", expiresAt: "2025-07-27" },
  { id: "inv2", email: "store@examplecafe.com", role: "STORE_OWNER", invitedBy: "박준혁", status: "수락", createdAt: "2025-07-15", expiresAt: "2025-07-22" },
  { id: "inv3", email: "manager2@corp.com", role: "ADMIN", invitedBy: "이서연", status: "만료", createdAt: "2025-07-01", expiresAt: "2025-07-08" },
  { id: "inv4", email: "bakery@example.kr", role: "STORE_OWNER", invitedBy: "박준혁", status: "취소", createdAt: "2025-07-10", expiresAt: "2025-07-17" },
];

