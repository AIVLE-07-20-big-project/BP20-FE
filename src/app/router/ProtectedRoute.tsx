import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { UserRole } from "../../entities/user/user.types";
import { useAuth } from "../providers/AuthProvider";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole === "STORE_OWNER" && user.role !== "STORE_OWNER") {
    return <Navigate to="/admin" replace />;
  }
  if (requiredRole === "ADMIN" && user.role === "STORE_OWNER") {
    return <Navigate to="/store" replace />;
  }

  return <>{children}</>;
}
