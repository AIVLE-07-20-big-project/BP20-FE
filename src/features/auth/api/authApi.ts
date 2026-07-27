import type { User, UserRole } from "../../../entities/user/user.types";
import { apiRequest } from "../../../shared/api/apiClient";

interface LoginResponse {
  accessToken: string;
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export async function loginWithPassword(email: string, password: string) {
  const response = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const user: User = { id: String(response.id), email: response.email, name: response.name, role: response.role };
  return { accessToken: response.accessToken, user };
}
