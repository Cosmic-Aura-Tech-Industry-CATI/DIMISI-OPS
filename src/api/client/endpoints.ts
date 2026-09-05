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
  departments: {
    list: "/departments",
    detail: (id: string) => `/departments/${id}`,
    create: "/departments",
    update: (id: string) => `/departments/${id}`,
    delete: (id: string) => `/departments/${id}`,
  },
  designations: {
    list: "/designations",
    detail: (id: string) => `/designations/${id}`,
    byDepartment: (departmentId: string) => `/designations/department/${departmentId}`,
    create: "/designations",
    update: (id: string) => `/designations/${id}`,
    delete: (id: string) => `/designations/${id}`,
  },
  projects: {
    list: "/projects",
    detail: (id: string) => `/projects/${id}`,
    create: "/projects",
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
  },
  tasks: {
    list: "/tasks",
    detail: (id: string) => `/tasks/${id}`,
    create: "/tasks",
    update: (id: string) => `/tasks/${id}`,
    delete: (id: string) => `/tasks/${id}`,
    request: (id: string) => `/tasks/${id}/request`,
    assign: (id: string) => `/tasks/${id}/assign`,
    start: (id: string) => `/tasks/${id}/start`,
    submit: (id: string) => `/tasks/${id}/submit`,
    review: (id: string) => `/tasks/${id}/review`,
  },
  leaderboard: {
    get: "/leaderboard",
  },
  notices: {
    list: "/notices",
    detail: (id: string) => `/notices/${id}`,
    create: "/notices",
    update: (id: string) => `/notices/${id}`,
    delete: (id: string) => `/notices/${id}`,
  },
  admins: {
    list: "/admins",
    stats: "/admins/stats",
    detail: (id: string) => `/admins/${id}`,
    update: (id: string) => `/admins/${id}`,
    revoke: (id: string) => `/admins/${id}/revoke`,
  },
  employees: {
    list: "/employees",
    detail: (id: string) => `/employees/${id}`,
    update: (id: string) => `/employees/${id}`,
    revoke: (id: string) => `/employees/${id}/revoke`,
  },
  dashboard: {
    overview: "/dashboard/overview",
  },
  reports: {
    overview: "/reports/overview",
    employees: "/reports/employees",
    tasks: "/reports/tasks",
    projects: "/reports/projects",
    departments: "/reports/departments",
  },
  settings: {
    preferences: "/settings/general/preferences",
    workspace: "/settings/general/workspace",
    setup2Fa: "/settings/general/2fa/authenticator/setup",
    verify2Fa: "/settings/general/2fa/authenticator/verify",
    checkPassword: "/settings/passwords/check",
    updatePassword: "/settings/passwords/update",
    profile: "/settings/profile",
    sessions: "/settings/sessions",
    revokeOtherSessions: "/settings/sessions/others",
    revokeSession: (id: string) => `/settings/sessions/${id}`,
  },
} as const;

