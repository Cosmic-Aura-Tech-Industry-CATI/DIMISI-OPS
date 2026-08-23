import { logAudit } from "@/lib/audit-log";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "@/auth/services/auth.service";
import { setUnauthorizedHandler } from "@/api/client/client";
import { clearTokens } from "@/api/client/token-store";

export type Role = "director" | "admin" | "employee" | "intern";

export interface AuthUser {
  id: string;
  _id?: string;
  code: string;
  empId?: string;
  name: string;
  email: string;
  role: Role | string;
  designation?: string;
  department?: string;
  avatar: string;
  isActive?: boolean;
  points?: number;
  phone?: string;
  joinDate?: string;
}

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function normalizeUser(raw: any): AuthUser {
  return {
    id: raw._id || raw.id || "",
    _id: raw._id || raw.id || "",
    code: raw.empId || raw.code || "EMP",
    empId: raw.empId || raw.code || "EMP",
    name: raw.name || "User",
    email: raw.email || "",
    role: raw.role || "employee",
    department: raw.department,
    designation: raw.designation,
    isActive: raw.isActive ?? true,
    avatar: raw.avatar || getInitials(raw.name),
    points: raw.points,
    phone: raw.phone,
    joinDate: raw.joinDate,
  };
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  signInWith: (user: AuthUser) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const g = globalThis as unknown as { __pollAuthCtx?: React.Context<AuthCtx | null> };
const Ctx = (g.__pollAuthCtx ??= createContext<AuthCtx | null>(null));
const KEY = "poll-auth-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return normalizeUser(JSON.parse(raw));
    } catch { }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    try {
      if (u) localStorage.setItem(KEY, JSON.stringify(u));
      else localStorage.removeItem(KEY);
    } catch { }
  };

  useEffect(() => {
    let active = true;

    // Verify/refresh session with backend using HTTP-only cookies
    void (async () => {
      try {
        const res = await authService.refreshSession();
        if (!active) return;
        if (res?.user) {
          const normalized = normalizeUser(res.user);
          setUser(normalized);
        }
      } catch {
        if (active) {
          // If refresh fails with 401, clear local cache
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    // Listen for unauthorized 401s from Axios response interceptor
    setUnauthorizedHandler(() => {
      clearTokens();
      setUser(null);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    });

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  const signInWith = (u: AuthUser) => {
    const normalized = normalizeUser(u);
    setUser(normalized);
    logAudit({
      category: "authentication",
      action: "Login",
      target: normalized.role === "admin" || normalized.role === "director" ? "Admin portal" : "Employee portal",
      details: "Signed in successfully.",
      actorName: normalized.name,
      actorId: normalized.code,
    });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      if (user) {
        logAudit({
          category: "authentication",
          action: "Logout",
          target: user.role === "admin" || user.role === "director" ? "Admin portal" : "Employee portal",
          details: "Session ended.",
          actorName: user.name,
          actorId: user.code,
        });
      }
      clearTokens();
      setUser(null);
    }
  };

  return (
    <Ctx.Provider value={{ user, loading, signInWith, setUser, logout }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  return (
    ctx ?? {
      user: null,
      loading: true,
      signInWith: () => { },
      setUser: () => { },
      logout: async () => { },
    }
  );
}
