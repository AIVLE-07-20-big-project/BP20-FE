import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#246BFD]/30 border-t-[#246BFD]" />
          로그인 정보를 확인하고 있습니다.
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === "STORE_OWNER" ? "/store" : "/admin"} replace />;
  }

  return <>{children}</>;
}
