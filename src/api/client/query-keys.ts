/** Centralised query keys — keeps invalidation predictable. */
export const queryKeys = {
  health: ["health"] as const,
  auth: {
    all: ["auth"] as const,
    session: ["auth", "session"] as const,
    me: ["auth", "me"] as const,
  },
  departments: {
    all: ["departments"] as const,
    list: () => ["departments", "list"] as const,
    detail: (id: string) => ["departments", "detail", id] as const,
  },
  designations: {
    all: ["designations"] as const,
    list: () => ["designations", "list"] as const,
    byDepartment: (departmentId: string) => ["designations", departmentId] as const,
    detail: (id: string) => ["designations", "detail", id] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: (filters?: Record<string, unknown>) => ["projects", "list", filters] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (filters?: Record<string, unknown>) => ["tasks", "list", filters] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
    available: (filters?: Record<string, unknown>) => ["tasks", "available", filters] as const,
    employee: (employeeId?: string) => ["tasks", "employee", employeeId] as const,
    reviews: () => ["tasks", "reviews"] as const,
  },
  admins: {
    all: ["admins"] as const,
    stats: () => ["admins", "stats"] as const,
    list: (filters?: Record<string, unknown>) => ["admins", "list", filters] as const,
    detail: (id: string) => ["admins", "detail", id] as const,
  },
  employees: {
    all: ["employees"] as const,
    list: (filters?: Record<string, unknown>) => ["employees", "list", filters] as const,
    detail: (id: string) => ["employees", "detail", id] as const,
  },
  leaderboard: {
    all: ["leaderboard"] as const,
    get: (limit?: number) => ["leaderboard", limit] as const,
  },
  notices: {
    all: ["notices"] as const,
    list: (filters?: Record<string, unknown>) => ["notices", "list", filters] as const,
    detail: (id: string) => ["notices", "detail", id] as const,
  },
} as const;



