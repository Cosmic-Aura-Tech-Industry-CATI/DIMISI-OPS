/**
 * Single source of truth for every backend path.
 * Add new endpoints here — never inline a path in a service.
 */
export const API_ENDPOINTS = {
  health: "/",
  auth: {
    login: "/api/v1/auth/login",
    verifyLogin: "/api/v1/auth/verify-login",
    resendOtp: "/api/v1/auth/resend-otp",
    refresh: "/api/v1/auth/refresh",
    createUser: "/api/v1/auth/create-user",
    logout: "/api/v1/auth/logout",
    forgetPassword: "/api/v1/auth/forget-password",
    verifyResetOtp: "/api/v1/auth/verify-reset-otp",
    resetPassword: "/api/v1/auth/reset-password",
  },
} as const;
