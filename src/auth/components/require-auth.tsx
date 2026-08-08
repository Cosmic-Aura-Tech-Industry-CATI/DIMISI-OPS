import type { ReactNode } from "react";
import { useAuthContext } from "../context/auth-context";
import type { UserRole } from "../types/auth";

interface RequireAuthProps {
  children: ReactNode;
  /** Restrict to one or more roles. */
  roles?: UserRole | UserRole[];
  /** Shown while the session is being resolved. */
  fallback?: ReactNode;
  /** Shown when the user is not allowed. */
  deniedFallback?: ReactNode;
}

/** Declarative guard for rendering protected UI. */
export function RequireAuth({ children, roles, fallback = null, deniedFallback = null }: RequireAuthProps) {
  const { isLoading, isAuthenticated, hasRole } = useAuthContext();

  if (isLoading) return <>{fallback}</>;
  if (!isAuthenticated) return <>{deniedFallback}</>;
  if (roles && !hasRole(roles)) return <>{deniedFallback}</>;
  return <>{children}</>;
}
