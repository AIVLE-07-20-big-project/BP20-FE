import type { User } from "../../../entities/user/user.types";
import { DEMO_USERS } from "../../../mocks";

const DEMO_USER_SESSION_KEY = "bp20:demo-user-id";
const SESSION_TOKEN_KEY = "bp20:access-token";
const LOCAL_TOKEN_KEY = "bp20:remembered-access-token";

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

export function getAccessToken() {
  return window.sessionStorage.getItem(SESSION_TOKEN_KEY)
    ?? window.localStorage.getItem(LOCAL_TOKEN_KEY);
}

export function saveAccessToken(token: string, remember: boolean) {
  clearAccessToken();
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(remember ? LOCAL_TOKEN_KEY : SESSION_TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  window.localStorage.removeItem(LOCAL_TOKEN_KEY);
}
