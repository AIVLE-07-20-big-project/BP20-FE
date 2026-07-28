import type { User } from "../../../entities/user/user.types";
import { DEMO_USERS } from "../../../mocks";

const DEMO_USER_SESSION_KEY = "bp20:demo-user-id";
const ACCESS_TOKEN_KEY = "bp20:access-token";

export function getSessionUser(): User | null {
  const userId = window.sessionStorage.getItem(DEMO_USER_SESSION_KEY);
  return DEMO_USERS.find((user) => user.id === userId) ?? null;
}

export function saveSessionUser(user: User | null) {
  if (user) {
    window.sessionStorage.setItem(DEMO_USER_SESSION_KEY, user.id);
    return;
  }

  window.sessionStorage.removeItem(DEMO_USER_SESSION_KEY);
}

export function getAccessToken(): string | null {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(token: string | null) {
  if (token) window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
