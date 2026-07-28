export type UserRole = "STORE_OWNER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  status?: UserStatus;
  storeName?: string;
  storeCategory?: string;
  organizationName?: string;
}
