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
} as const;
