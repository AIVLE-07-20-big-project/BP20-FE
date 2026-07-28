import type { UserRole, UserStatus } from "../../../entities/user/user.types";
import { apiRequest } from "../../../shared/api/apiClient";

export interface AdminAccount {
  id: number;
  email: string;
  name: string;
  phoneNumber: string | null;
  role: Extract<UserRole, "SUPER_ADMIN" | "ADMIN">;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoreOwnerAccount {
  id: number;
  email: string;
  name: string;
  phoneNumber: string | null;
  status: UserStatus;
  storeId: number | null;
  storeName: string | null;
  businessNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getAdminAccounts() {
  return apiRequest<AdminAccount[]>("/api/iam/admin");
}

export function changeAdminStatus(
  adminId: number,
  nextStatus: UserStatus,
  currentPassword: string,
) {
  const action = nextStatus === "ACTIVE" ? "activate" : "deactivate";
  return apiRequest<AdminAccount>(`/api/iam/admin/${adminId}/${action}`, {
    method: "PATCH",
    body: JSON.stringify({ currentPassword }),
  });
}

export function getStoreOwnerAccounts() {
  return apiRequest<StoreOwnerAccount[]>("/api/admin/accounts/store-owners");
}

export function changeStoreOwnerStatus(
  storeOwnerId: number,
  nextStatus: UserStatus,
  currentPassword: string,
) {
  const action = nextStatus === "ACTIVE" ? "activate" : "deactivate";
  return apiRequest<StoreOwnerAccount>(
    `/api/admin/accounts/store-owners/${storeOwnerId}/${action}`,
    {
      method: "PATCH",
      body: JSON.stringify({ currentPassword }),
    },
  );
}
