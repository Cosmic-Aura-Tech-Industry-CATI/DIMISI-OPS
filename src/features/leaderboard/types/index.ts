import type { AuthUser } from "@/auth/types/auth";

export interface LeaderboardEntry {
  _id: string;
  name: string;
  email?: string;
  points: number;
  completedTasksCount?: number;
  completedTasks?: number;
  rank?: number;
  user?: AuthUser;
  isActive?: boolean;
  status?: string;
  avatar?: string;
  avtar?: string;
  avatarUrl?: string;
  photo?: string;
  profileImage?: string;
  department?: string | { _id: string; name: string };
  empId?: string;
  code?: string;
  completionRate?: number;
  totalTasks?: number;
  [key: string]: unknown;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}
