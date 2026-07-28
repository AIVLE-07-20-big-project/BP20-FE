import type { User, UserRole, UserStatus } from "../../../entities/user/user.types";
import { ApiError, apiRequest } from "../../../shared/api/apiClient";

interface AuthUserResponse {
  id: number;
  email: string;
  name: string;
  phoneNumber: string | null;
  role: UserRole;
  status: UserStatus;
}

interface AuthResponse extends AuthUserResponse {
  accessToken: string;
  tokenType: string;
}

export interface SignupPayload {
  email: string;
  temporaryPassword: string;
  password: string;
  name: string;
  phoneNumber: string | null;
}

function toUser(response: AuthUserResponse): User {
  return {
    id: String(response.id),
    email: response.email,
    name: response.name,
    phoneNumber: response.phoneNumber ?? undefined,
    role: response.role,
    status: response.status,
  };
}

export async function login(email: string, password: string) {
  const response = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return {
    token: response.accessToken,
    user: toUser(response),
  };
}

export async function signup(payload: SignupPayload) {
  const response = await apiRequest<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    token: response.accessToken,
    user: toUser(response),
  };
}

export async function getMe() {
  return toUser(await apiRequest<AuthUserResponse>("/api/auth/me"));
}

/**
 * 백엔드 main에는 비밀번호 재설정 API가 아직 없습니다.
 * 기존 작업 중인 화면을 보존하면서 잘못된 API 요청이 발생하지 않도록 명시적으로 차단합니다.
 */
export async function requestPasswordReset(_email: string): Promise<never> {
  throw new ApiError("비밀번호 재설정 기능은 현재 지원되지 않습니다.", 501);
}

export async function confirmPasswordReset(
  _token: string,
  _password: string,
): Promise<never> {
  throw new ApiError("비밀번호 재설정 기능은 현재 지원되지 않습니다.", 501);
}
