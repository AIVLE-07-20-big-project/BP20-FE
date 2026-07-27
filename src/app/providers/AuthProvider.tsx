import { createContext, useContext, useState } from "react";
import type { User, UserRole } from "../../entities/user/user.types";
import { getSessionUser, saveSessionUser } from "../../features/auth/model/authSession";
import { DEMO_USERS } from "../../mocks";
import { loginWithPassword } from "../../features/auth/api/authApi";
import { saveAccessToken } from "../../shared/api/apiClient";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  switchDemo: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getSessionUser);

  const updateUser = (nextUser: User | null) => {
    setUser(nextUser);
    saveSessionUser(nextUser);
  };

  const login = async (email: string, password: string, role: UserRole): Promise<{ ok: boolean; error?: string }> => {
    try {
      const result = await loginWithPassword(email, password);
      if (result.user.role !== role && !(result.user.role === "SUPER_ADMIN" && role === "ADMIN")) {
        return { ok: false, error: `이 계정은 ${result.user.role === "STORE_OWNER" ? "점주" : "관리자"} 전용입니다. 올바른 포털을 선택해 주세요.` };
      }
      saveAccessToken(result.accessToken);
      updateUser(result.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "로그인에 실패했습니다." };
    }
  };

  const logout = () => {
    saveAccessToken(null);
    updateUser(null);
  };

  const switchDemo = (userId: string) => {
    const u = DEMO_USERS.find((u) => u.id === userId);
    if (u) {
      saveAccessToken(null);
      updateUser(u);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
