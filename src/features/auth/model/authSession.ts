import type { User } from "../../../entities/user/user.types";
const USER_SESSION_KEY = "bp20:session-user";

export function getSessionUser(): User | null {
  const value = window.sessionStorage.getItem(USER_SESSION_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as User;
  } catch {
    window.sessionStorage.removeItem(USER_SESSION_KEY);
    return null;
  }
}

export function saveSessionUser(user: User | null) {
  if (user) {
    window.sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    return;
  }

  window.sessionStorage.removeItem(USER_SESSION_KEY);
}
