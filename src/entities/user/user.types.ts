export type UserRole = "STORE_OWNER" | "ADMIN" | "SUPER_ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeName?: string;
  storeCategory?: string;
  organizationName?: string;
}
