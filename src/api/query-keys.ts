/** Centralised query keys — keeps invalidation predictable. */
export const queryKeys = {
  health: ["health"] as const,
  auth: {
    all: ["auth"] as const,
    session: ["auth", "session"] as const,
    me: ["auth", "me"] as const,
  },
} as const;
