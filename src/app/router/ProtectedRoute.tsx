import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { UserRole } from "../../entities/user/user.types";
import { useAuth } from "../providers/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
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
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole === "STORE_OWNER" && user.role !== "STORE_OWNER") {
    return <Navigate to="/admin" replace />;
  }
  if (requiredRole === "ADMIN" && user.role === "STORE_OWNER") {
    return <Navigate to="/store" replace />;
  }
  if (requiredRole === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
    return <Navigate to={user.role === "STORE_OWNER" ? "/store" : "/admin"} replace />;
  }

  return <>{children}</>;
}
