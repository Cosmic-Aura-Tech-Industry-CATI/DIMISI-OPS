import { logAudit } from "@/lib/audit-log";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "admin" | "employee";
export interface AuthUser {
  id: string;
  code: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (role: Role) => void;
  /** Sign in with a resolved account (mock credential check happens first). */
  signInWith: (user: AuthUser) => void;
  logout: () => void;
}

// Keep a single context instance even if this module is evaluated more than
// once (route code-splitting can duplicate module graphs in dev).
const g = globalThis as unknown as { __pollAuthCtx?: React.Context<AuthCtx | null> };
const Ctx = (g.__pollAuthCtx ??= createContext<AuthCtx | null>(null));
const KEY = "poll-auth-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const login = (role: Role) => {
    const u: AuthUser =
      role === "admin"
        ? { id: "a1", code: "DMSDIR01", name: "Shikhar Dixit", email: "shikhar@dimisi.io", role: "admin", avatar: "SD" }
        : { id: "u1", code: "DMSEMP2402", name: "Ava Chen", email: "ava.chen@poll.io", role: "employee", avatar: "AC" };
    setUser(u);
    localStorage.setItem(KEY, JSON.stringify(u));
    logAudit({
      category: "authentication",
      action: "Login",
      target: role === "admin" ? "Admin portal" : "Employee portal",
      details: "Signed in successfully.",
      actorName: u.name,
      actorId: u.code,
    });
  };

  const signInWith = (u: AuthUser) => {
    setUser(u);
    try {
      localStorage.setItem(KEY, JSON.stringify(u));
    } catch {}
    logAudit({
      category: "authentication",
      action: "Login",
      target: u.role === "admin" ? "Admin portal" : "Employee portal",
      details: "Signed in successfully.",
      actorName: u.name,
      actorId: u.code,
    });
  };

  const logout = () => {
    if (user) {
      logAudit({
        category: "authentication",
        action: "Logout",
        target: user.role === "admin" ? "Admin portal" : "Employee portal",
        details: "Session ended.",
        actorName: user.name,
        actorId: user.code,
      });
    }
    setUser(null);
    localStorage.removeItem(KEY);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, signInWith, logout }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  return (
    ctx ?? {
      user: null,
      loading: true,
      login: () => {},
      signInWith: () => {},
      logout: () => {},
    }
  );
}
