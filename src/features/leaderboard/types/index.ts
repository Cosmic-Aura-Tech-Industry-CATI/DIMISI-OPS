import type { AuthUser } from "@/auth/types/auth";

export interface LeaderboardEntry {
  _id: string;
  name: string;
  email?: string;
  points: number;
  completedTasksCount?: number;
  rank?: number;
  user?: AuthUser;
  [key: string]: unknown;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

