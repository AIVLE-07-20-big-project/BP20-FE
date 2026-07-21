import type { User } from "../../../entities/user/user.types";
import { DEMO_USERS } from "../../../mocks";

const DEMO_USER_SESSION_KEY = "bp20:demo-user-id";

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
