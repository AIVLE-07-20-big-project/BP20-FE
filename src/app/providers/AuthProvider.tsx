import { createContext, useContext, useEffect, useState } from "react";
import type { User, UserRole } from "../../entities/user/user.types";
import * as authApi from "../../features/auth/api/authApi";
import type { SignupPayload } from "../../features/auth/api/authApi";
import {
  clearAccessToken,
  getSessionUser,
  saveAccessToken,
  saveSessionUser,
} from "../../features/auth/model/authSession";
import { DEMO_USERS } from "../../mocks";
import {
  ApiError,
  AUTH_EXPIRED_EVENT,
} from "../../shared/api/apiClient";

interface AuthContextType {
  user: User | null;
  isInitializing: boolean;
  isDemo: boolean;
  login: (
    email: string,
    password: string,
    role: UserRole,
    remember: boolean,
  ) => Promise<{ ok: boolean; error?: string }>;
  signup: (
    payload: SignupPayload,
  ) => Promise<{ ok: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  switchDemo: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const demoUser = getSessionUser();
  const [user, setUser] = useState<User | null>(demoUser);
  const [isInitializing, setIsInitializing] = useState(!demoUser);
  const [isDemo, setIsDemo] = useState(Boolean(demoUser));

  useEffect(() => {
    if (demoUser) {
      setIsInitializing(false);
      return;
    }

    // 액세스 토큰이 없어도 HttpOnly 리프레시 쿠키가 남아 있을 수 있으므로
    // 현재 사용자 조회를 시도하고 apiClient의 자동 갱신 흐름에 맡긴다.
    authApi.getMe()
      .then((currentUser) => {
        setUser(currentUser);
        setIsDemo(false);
      })
      .catch(() => {
        clearAccessToken();
        setUser(null);
      })
      .finally(() => setIsInitializing(false));
  }, [demoUser]);

  useEffect(() => {
    const handleExpiredSession = () => {
      clearAccessToken();
      saveSessionUser(null);
      setUser(null);
      setIsDemo(false);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
  }, []);

  const updateDemoUser = (nextUser: User | null) => {
    setUser(nextUser);
    saveSessionUser(nextUser);
    setIsDemo(Boolean(nextUser));
  };

  const login = async (
    email: string,
    password: string,
    role: UserRole,
    remember: boolean,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const result = await authApi.login(email.trim(), password, remember);
      const roleMatches = result.user.role === role
        || (result.user.role === "SUPER_ADMIN" && role === "ADMIN");

      if (!roleMatches) {
        await authApi.logout().catch(() => undefined);
        clearAccessToken();
        return {
          ok: false,
          error: `이 계정은 ${result.user.role === "STORE_OWNER" ? "점주" : "관리자"} 전용입니다. 올바른 포털을 선택해 주세요.`,
        };
      }

      saveSessionUser(null);
      saveAccessToken(result.token);
      setUser(result.user);
      setIsDemo(false);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof ApiError
          ? error.message
          : "로그인에 실패했습니다.",
      };
    }
  };

  const logout = async () => {
    try {
      if (!isDemo) {
        await authApi.logout();
      }
    } finally {
      clearAccessToken();
      updateDemoUser(null);
    }
  };

  const signup = async (
    payload: SignupPayload,
  ): Promise<{ ok: boolean; user?: User; error?: string }> => {
    try {
      const result = await authApi.signup(payload);
      saveSessionUser(null);
      saveAccessToken(result.token);
      setUser(result.user);
      setIsDemo(false);
      return { ok: true, user: result.user };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof ApiError
          ? error.message
          : "회원가입에 실패했습니다.",
      };
    }
  };

  const switchDemo = (userId: string) => {
    const nextUser = DEMO_USERS.find((candidate) => candidate.id === userId);
    if (nextUser) {
      if (!isDemo && user) {
        void authApi.logout().catch(() => undefined);
      }
      clearAccessToken();
      updateDemoUser(nextUser);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isInitializing,
      isDemo,
      login,
      signup,
      logout,
      switchDemo,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
