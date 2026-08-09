/**
 * Single source of truth for every backend path.
 * Add new endpoints here — never inline a path in a service.
 */
export const API_ENDPOINTS = {
  health: "/",
  auth: {
    login: "/auth/login",
    verifyLogin: "/auth/verify-login",
    resendOtp: "/auth/resend-otp",
    refresh: "/auth/refresh",
    createUser: "/auth/create-user",
    logout: "/auth/logout",
    forgetPassword: "/auth/forget-password",
    verifyResetOtp: "/auth/verify-reset-otp",
    resetPassword: "/auth/reset-password",
  },
} as const;
