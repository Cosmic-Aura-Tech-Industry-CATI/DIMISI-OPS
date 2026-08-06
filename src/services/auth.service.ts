/**
 * Type-safe service functions — one per endpoint.
 * Services never touch React; hooks in `src/hooks/api` wrap them.
 */
import { http } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { setAccessToken, setResetToken, clearTokens } from "@/api/token-store";
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
} from "@/types/auth";

const { auth, health } = API_ENDPOINTS;

/** GET / — public health/root check. */
export function getHealth() {
  return http.get<HealthResponse>(health, { authMode: "none" });
}

/** POST /api/v1/auth/login — step 1, issues an OTP. */
export function login(payload: LoginRequest) {
  return http.post<LoginResponse>(auth.login, payload, { authMode: "none" });
}

/** POST /api/v1/auth/verify-login — step 2, exchanges the OTP for a session. */
export async function verifyLogin(payload: VerifyLoginRequest) {
  const res = await http.post<VerifyLoginResponse>(auth.verifyLogin, payload, {
    authMode: "none",
  });
  if (res?.accessToken) setAccessToken(res.accessToken);
  return res;
}

/** POST /api/v1/auth/resend-otp — re-sends the login OTP. */
export function resendOtp(payload: ResendOtpRequest) {
  return http.post<MessageResponse>(auth.resendOtp, payload, { authMode: "none" });
}

/** POST /api/v1/auth/refresh — uses the httpOnly refresh-token cookie. */
export async function refreshSession() {
  const res = await http.post<RefreshResponse>(auth.refresh, undefined, { authMode: "none" });
  if (res?.accessToken) setAccessToken(res.accessToken);
  return res;
}

/** POST /api/v1/auth/create-user — requires a Director bearer token. */
export function createUser(payload: CreateUserRequest) {
  return http.post<CreateUserResponse>(auth.createUser, payload, { authMode: "bearer" });
}

/** POST /api/v1/auth/logout — requires a bearer token. */
export async function logout() {
  try {
    return await http.post<MessageResponse>(auth.logout, undefined, { authMode: "bearer" });
  } finally {
    clearTokens();
  }
}

/** POST /api/v1/auth/forget-password — starts password recovery. */
export function forgetPassword(payload: ForgetPasswordRequest) {
  return http.post<ForgetPasswordResponse>(auth.forgetPassword, payload, { authMode: "none" });
}

/** POST /api/v1/auth/verify-reset-otp — returns the short-lived reset token. */
export async function verifyResetOtp(payload: VerifyResetOtpRequest) {
  const res = await http.post<VerifyResetOtpResponse>(auth.verifyResetOtp, payload, {
    authMode: "none",
  });
  if (res?.resetToken) setResetToken(res.resetToken);
  return res;
}

/** PATCH /api/v1/auth/reset-password — authorised by the stored reset token. */
export async function resetPassword({ resetToken, ...payload }: ResetPasswordRequest) {
  if (resetToken) setResetToken(resetToken);
  try {
    return await http.patch<MessageResponse>(auth.resetPassword, payload, { authMode: "reset" });
  } finally {
    setResetToken(null);
  }
}

export const authService = {
  getHealth,
  login,
  verifyLogin,
  resendOtp,
  refreshSession,
  createUser,
  logout,
  forgetPassword,
  verifyResetOtp,
  resetPassword,
};
