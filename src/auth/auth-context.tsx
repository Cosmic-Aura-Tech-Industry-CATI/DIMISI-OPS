/**
 * Reusable authentication context built on the API layer.
 *
 * Responsibilities:
 *  - hydrate the session on boot (sessionStorage token + refresh cookie)
 *  - expose the current user, status flags and auth actions
 *  - react to a hard 401 from the Axios interceptor
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { setUnauthorizedHandler } from "@/api/client";
import type { ApiError } from "@/api/errors";
import { queryKeys } from "@/api/query-keys";
import { clearTokens, getAccessToken, hydrateTokens } from "@/api/token-store";
import {
  useForgetPassword,
  useLogin,
  useLogout,
  useResendOtp,
  useResetPassword,
  useVerifyLogin,
  useVerifyResetOtp,
} from "@/hooks/api/use-auth-api";
import { authService } from "@/services/auth.service";
import type {
  AuthUser,
  ForgetPasswordRequest,
  LoginRequest,
  ResendOtpRequest,
  ResetPasswordRequest,
  UserRole,
  VerifyLoginRequest,
  VerifyResetOtpRequest,
} from "@/types/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
  /** Pending network activity for any auth action. */
  isPending: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  login: (payload: LoginRequest) => Promise<void>;
  verifyLogin: (payload: VerifyLoginRequest) => Promise<AuthUser>;
  resendOtp: (payload: ResendOtpRequest) => Promise<void>;
  forgetPassword: (payload: ForgetPasswordRequest) => Promise<void>;
  verifyResetOtp: (payload: VerifyResetOtpRequest) => Promise<void>;
  resetPassword: (payload: ResetPasswordRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<ApiError | null>(null);

  const loginMutation = useLogin();
  const verifyLoginMutation = useVerifyLogin();
  const resendOtpMutation = useResendOtp();
  const forgetPasswordMutation = useForgetPassword();
  const verifyResetOtpMutation = useVerifyResetOtp();
  const resetPasswordMutation = useResetPassword();
  const logoutMutation = useLogout();

  const endSession = useCallback(() => {
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
    queryClient.removeQueries({ queryKey: queryKeys.auth.all });
  }, [queryClient]);

  /* Boot: hydrate the token, then try the refresh cookie. */
  useEffect(() => {
    let active = true;

    hydrateTokens();
    void (async () => {
      try {
        const res = await authService.refreshSession();
        if (!active) return;
        if (res?.user) setUser(res.user);
        setStatus(res?.accessToken || getAccessToken() ? "authenticated" : "unauthenticated");
      } catch {
        if (active) endSession();
      }
    })();

    return () => {
      active = false;
    };
  }, [endSession]);

  /* Hard 401 from the response interceptor. */
  useEffect(() => {
    setUnauthorizedHandler(() => endSession());
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err as ApiError);
      throw err;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isPending =
      loginMutation.isPending ||
      verifyLoginMutation.isPending ||
      resendOtpMutation.isPending ||
      forgetPasswordMutation.isPending ||
      verifyResetOtpMutation.isPending ||
      resetPasswordMutation.isPending ||
      logoutMutation.isPending;

    return {
      user,
      status,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      error,
      isPending,
      hasRole: (role) =>
        !!user && (Array.isArray(role) ? role.includes(user.role) : user.role === role),
      login: async (payload) => {
        await run(() => loginMutation.mutateAsync(payload));
      },
      verifyLogin: async (payload) => {
        const res = await run(() => verifyLoginMutation.mutateAsync(payload));
        setUser(res.user);
        setStatus("authenticated");
        return res.user;
      },
      resendOtp: async (payload) => {
        await run(() => resendOtpMutation.mutateAsync(payload));
      },
      forgetPassword: async (payload) => {
        await run(() => forgetPasswordMutation.mutateAsync(payload));
      },
      verifyResetOtp: async (payload) => {
        await run(() => verifyResetOtpMutation.mutateAsync(payload));
      },
      resetPassword: async (payload) => {
        await run(() => resetPasswordMutation.mutateAsync(payload));
      },
      logout: async () => {
        try {
          await logoutMutation.mutateAsync();
        } finally {
          endSession();
        }
      },
      refresh: async () => {
        const res = await authService.refreshSession();
        if (res?.user) setUser(res.user);
        setStatus("authenticated");
      },
    };
  }, [
    user,
    status,
    error,
    run,
    endSession,
    loginMutation,
    verifyLoginMutation,
    resendOtpMutation,
    forgetPasswordMutation,
    verifyResetOtpMutation,
    resetPasswordMutation,
    logoutMutation,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within <AuthProvider>");
  return ctx;
}
