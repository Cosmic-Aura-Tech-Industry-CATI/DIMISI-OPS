/**
 * React Query hooks — one per endpoint.
 * Components should use these instead of calling services directly.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import type { ApiError } from "@/api/client/errors";
import { queryKeys } from "@/api/client/query-keys";
import { authService } from "../services/auth.service";
import type { MessageResponse } from "@/types/api";
import type {
  CreateUserRequest,
  CreateUserResponse,
  ForgetPasswordRequest,
  ForgetPasswordResponse,
  HealthResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  ResendOtpRequest,
  ResetPasswordRequest,
  VerifyLoginRequest,
  VerifyLoginResponse,
  VerifyResetOtpRequest,
  VerifyResetOtpResponse,
} from "../types/auth";

type MutationOpts<TData, TVars> = Omit<
  UseMutationOptions<TData, ApiError, TVars>,
  "mutationFn"
>;

/** GET / */
export function useHealth(
  options?: Omit<UseQueryOptions<HealthResponse, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<HealthResponse, ApiError>({
    queryKey: queryKeys.health,
    queryFn: () => authService.getHealth(),
    staleTime: 60_000,
    ...options,
  });
}

/** POST /api/v1/auth/login */
export function useLogin(options?: MutationOpts<LoginResponse, LoginRequest>) {
  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationKey: ["auth", "login"],
    mutationFn: (payload) => authService.login(payload),
    ...options,
  });
}

/** POST /api/v1/auth/verify-login */
export function useVerifyLogin(options?: MutationOpts<VerifyLoginResponse, VerifyLoginRequest>) {
  const queryClient = useQueryClient();
  return useMutation<VerifyLoginResponse, ApiError, VerifyLoginRequest>({
    mutationKey: ["auth", "verify-login"],
    mutationFn: (payload) => authService.verifyLogin(payload),
    ...options,
    onSuccess: (...args) => {
      queryClient.setQueryData(queryKeys.auth.me, args[0].user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      options?.onSuccess?.(...args);
    },
  });
}

/** POST /api/v1/auth/resend-otp */
export function useResendOtp(options?: MutationOpts<MessageResponse, ResendOtpRequest>) {
  return useMutation<MessageResponse, ApiError, ResendOtpRequest>({
    mutationKey: ["auth", "resend-otp"],
    mutationFn: (payload) => authService.resendOtp(payload),
    ...options,
  });
}

/** POST /api/v1/auth/refresh (refresh-token cookie) */
export function useRefreshSession(options?: MutationOpts<RefreshResponse, void>) {
  return useMutation<RefreshResponse, ApiError, void>({
    mutationKey: ["auth", "refresh"],
    mutationFn: () => authService.refreshSession(),
    ...options,
  });
}

/** POST /api/v1/auth/create-user (Director bearer token) */
export function useCreateUser(options?: MutationOpts<CreateUserResponse, CreateUserRequest>) {
  const queryClient = useQueryClient();
  return useMutation<CreateUserResponse, ApiError, CreateUserRequest>({
    mutationKey: ["auth", "create-user"],
    mutationFn: (payload) => authService.createUser(payload),
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      options?.onSuccess?.(...args);
    },
  });
}

/** POST /api/v1/auth/logout (bearer token) */
export function useLogout(options?: MutationOpts<MessageResponse, void>) {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, ApiError, void>({
    mutationKey: ["auth", "logout"],
    mutationFn: () => authService.logout(),
    ...options,
    onSettled: (...args) => {
      queryClient.clear();
      options?.onSettled?.(...args);
    },
  });
}

/** POST /api/v1/auth/forget-password */
export function useForgetPassword(
  options?: MutationOpts<ForgetPasswordResponse, ForgetPasswordRequest>,
) {
  return useMutation<ForgetPasswordResponse, ApiError, ForgetPasswordRequest>({
    mutationKey: ["auth", "forget-password"],
    mutationFn: (payload) => authService.forgetPassword(payload),
    ...options,
  });
}

/** POST /api/v1/auth/verify-reset-otp */
export function useVerifyResetOtp(
  options?: MutationOpts<VerifyResetOtpResponse, VerifyResetOtpRequest>,
) {
  return useMutation<VerifyResetOtpResponse, ApiError, VerifyResetOtpRequest>({
    mutationKey: ["auth", "verify-reset-otp"],
    mutationFn: (payload) => authService.verifyResetOtp(payload),
    ...options,
  });
}

/** PATCH /api/v1/auth/reset-password (reset token) */
export function useResetPassword(options?: MutationOpts<MessageResponse, ResetPasswordRequest>) {
  return useMutation<MessageResponse, ApiError, ResetPasswordRequest>({
    mutationKey: ["auth", "reset-password"],
    mutationFn: (payload) => authService.resetPassword(payload),
    ...options,
  });
}
