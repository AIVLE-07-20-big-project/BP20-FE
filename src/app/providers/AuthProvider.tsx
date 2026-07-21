import { createContext, useContext, useState } from "react";
import type { User, UserRole } from "../../entities/user/user.types";
import { getSessionUser, saveSessionUser } from "../../features/auth/model/authSession";
import { DEMO_USERS } from "../../mocks";

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

  const login = async (email: string, _password: string, role: UserRole): Promise<{ ok: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 1000));

    const matched = DEMO_USERS.find((u) => u.email === email);
    if (!matched) {
      return { ok: false, error: "계정 정보가 올바르지 않습니다. 초대받은 이메일 주소와 비밀번호를 확인해 주세요." };
    }

    if (matched.role !== role && !(matched.role === "SUPER_ADMIN" && role === "ADMIN")) {
      return { ok: false, error: `이 계정은 ${matched.role === "STORE_OWNER" ? "점주" : "관리자"} 전용입니다. 올바른 포털을 선택해 주세요.` };
    }

    updateUser(matched);
    return { ok: true };
  };

  const logout = () => updateUser(null);

  const switchDemo = (userId: string) => {
    const u = DEMO_USERS.find((u) => u.id === userId);
    if (u) updateUser(u);
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
