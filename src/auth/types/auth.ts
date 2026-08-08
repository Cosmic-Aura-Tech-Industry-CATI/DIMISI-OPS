/** Domain types for the authentication module. */

export type UserRole = "director" | "admin" | "employee";

export interface AuthUser {
  id: string;
  code?: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  department?: string;
  avatar?: string;
  isActive?: boolean;
  createdAt?: string;
}

/* ---------------------------------- health --------------------------------- */

export interface HealthResponse {
  status?: string;
  message?: string;
  uptime?: number;
  version?: string;
}

/* ---------------------------------- login ---------------------------------- */

export interface LoginRequest {
  email: string;
  password: string;
}

/** Step 1 — credentials accepted, an OTP was emailed. */
export interface LoginResponse {
  message?: string;
  email: string;
  /** Opaque handle identifying the pending OTP challenge, when the API issues one. */
  otpToken?: string;
  expiresIn?: number;
}

export interface VerifyLoginRequest {
  email: string;
  otp: string;
  otpToken?: string;
}

/** Step 2 — OTP verified, session issued (refresh token set as httpOnly cookie). */
export interface VerifyLoginResponse {
  accessToken: string;
  expiresIn?: number;
  user: AuthUser;
}

export interface ResendOtpRequest {
  email: string;
  otpToken?: string;
}

/* --------------------------------- refresh --------------------------------- */

/** Uses the refresh-token cookie — no request body. */
export interface RefreshResponse {
  accessToken: string;
  expiresIn?: number;
  user?: AuthUser;
}

/* ------------------------------- create user ------------------------------- */

export interface CreateUserRequest {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  designation?: string;
  department?: string;
  phone?: string;
}

export interface CreateUserResponse {
  message?: string;
  user: AuthUser;
  /** Present when the backend generates the initial password. */
  temporaryPassword?: string;
}

/* ----------------------------- password recovery ---------------------------- */

export interface ForgetPasswordRequest {
  email: string;
}

export interface ForgetPasswordResponse {
  message?: string;
  email: string;
  expiresIn?: number;
}

export interface VerifyResetOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyResetOtpResponse {
  message?: string;
  /** Short-lived token authorising `PATCH /auth/reset-password`. */
  resetToken: string;
  expiresIn?: number;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword?: string;
  /** Optional override; the API client attaches the stored reset token by default. */
  resetToken?: string;
}
