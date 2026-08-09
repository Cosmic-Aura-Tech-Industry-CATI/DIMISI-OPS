/** Domain types for the authentication module. */

export type UserRole = "director" | "admin" | "employee" | "intern";

export interface AuthUser {
  id: string;
  _id?: string;
  code?: string;
  empId?: string;
  name: string;
  email: string;
  role: UserRole | string;
  designation?: string;
  department?: string;
  avatar?: string;
  isActive?: boolean;
  points?: number;
  phone?: string;
  joinDate?: string;
  createdAt?: string;
  updatedAt?: string;
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
  status?: string;
  message?: string;
  email?: string;
}

export interface VerifyLoginRequest {
  email: string;
  otp: string;
}

/** Step 2 — OTP verified, session issued (cookies set automatically). */
export interface VerifyLoginResponse {
  status?: string;
  user: AuthUser;
}

export interface ResendOtpRequest {
  email: string;
  type?: string;
}

/* --------------------------------- refresh --------------------------------- */

/** Uses the refresh-token cookie — no request body. */
export interface RefreshResponse {
  status?: string;
  message?: string;
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
