import { createContext } from "react";
import type { User, UserRole } from "../../entities/user/user.types";
import type { SignupPayload } from "../../features/auth/api/authApi";

export interface AuthContextValue {
  user: User | null;
  isInitializing: boolean;
  isDemo: boolean;
  login: (
    email: string,
    password: string,
    role: UserRole,
    remember: boolean,
    captchaToken: string | null,
  ) => Promise<{ ok: boolean; error?: string; errorCode?: string }>;
  signup: (
    payload: SignupPayload,
  ) => Promise<{ ok: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  switchDemo: (userId: string) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
